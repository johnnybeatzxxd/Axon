from typing import Any, Dict, List

import inspect
from pydantic_ai import Tool, RunContext
import types

def format_mcp_tools_for_db(tools: List[Any]) -> List[Dict[str, str]]:
    formatted_data: List[Dict[str, str]] = []
    for tool in tools:
        name = tool.name
        description = tool.description or "No description provided for this tool."

        parameters_list: List[str] = []
        input_schema = tool.inputSchema or {}
        properties = input_schema.get("properties", {})
        required_params = set(input_schema.get("required", []))

        for param_name, details in properties.items():
            param_type = details.get("type", "any")
            is_required = "required" if param_name in required_params else "optional"
            param_str = f"{param_name} ({param_type}, {is_required})"

            if "default" in details:
                default_val = details["default"]
                if isinstance(default_val, str) and default_val:
                    param_str += f", default='{default_val}'"
                elif isinstance(default_val, str) and not default_val:
                    param_str += ", default=''"
                else:
                    param_str += f", default={default_val}"

            parameters_list.append(param_str)

        if parameters_list:
            params_section = "\nParameters: " + ", ".join(parameters_list)
        else:
            params_section = "\nParameters: None"

        document_string = f"Tool: {name}\nDescription: {description}{params_section}"
        formatted_data.append({"name": name, "document": document_string})

    return formatted_data


def build_available_tools(mcp_tools_list: List[Any], chosen_names: List[str], custom_tools: List[Dict[str, Any]]):
    available = [
        {
            "type": "function",
            "function": {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.inputSchema,
            },
        }
        for tool in mcp_tools_list
        if tool.name in chosen_names
    ]
    return available + list(custom_tools)


def convert_schema_to_params(schema: Dict[str, Any]) -> List[inspect.Parameter]:
    params = []
    properties = schema.get('properties', {})
    required = schema.get('required', [])
    for prop_name, prop_schema in properties.items():
        annotation = str if prop_schema.get('type') == 'string' else \
                     int if prop_schema.get('type') == 'integer' else \
                     float if prop_schema.get('type') == 'number' else \
                     bool if prop_schema.get('type') == 'boolean' else \
                     list if prop_schema.get('type') == 'array' else \
                     dict if prop_schema.get('type') == 'object' else Any
        default = inspect.Parameter.empty if prop_name in required else prop_schema.get('default', inspect.Parameter.empty)
        params.append(inspect.Parameter(
            name=prop_name,
            kind=inspect.Parameter.POSITIONAL_OR_KEYWORD,
            annotation=annotation,
            default=default
        ))
    return params

def create_function_from_schema(session: Any, name: str, schema: Dict[str, Any]) -> types.FunctionType:
    parameters = convert_schema_to_params(schema)
    
    # Prepend the ctx parameter with the required annotation
    ctx_param = inspect.Parameter(
        name='ctx',
        kind=inspect.Parameter.POSITIONAL_OR_KEYWORD,
        annotation=RunContext[Any],  # Use your deps_type if not Any (e.g., RunContext[YourDepsType])
    )
    parameters = [ctx_param] + parameters
    
    sig = inspect.Signature(parameters=parameters)
    
    async def function_body(ctx: RunContext[Any], **kwargs) -> Any:
        # Call the MCP tool; adjust based on your exact MCP SDK method (e.g., session.call_tool)
        result = await session.call_tool(name, arguments=kwargs)  # Or sync if not async: session.call_tool(...)
        # Process result; assuming it returns a usable value (e.g., string or dict)
        # If result has a specific format, extract accordingly (e.g., result['content'])
        return result  # Adjust to return the appropriate output
    
    dynamic_function = types.FunctionType(
        function_body.__code__,
        function_body.__globals__,
        name=name,
        argdefs=function_body.__defaults__,
        closure=function_body.__closure__,
    )
    dynamic_function.__signature__ = sig
    dynamic_function.__annotations__ = {param.name: param.annotation for param in parameters}
    return dynamic_function 

def pydantic_tool_from_function_schema(session: Any, func_schema: Dict[str, Any]) -> Tool[Any]:
    name = func_schema['name']
    description = func_schema['description']
    schema = func_schema['parameters']
    tool_function = create_function_from_schema(session=session, name=name, schema=schema)
    return Tool(
        name=name,
        description=description,
        function=tool_function,
        takes_ctx=True  # Set to False if your tools don't need RunContext; adjust based on needs
    )
