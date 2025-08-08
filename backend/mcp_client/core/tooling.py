from typing import Any, Dict, List


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


