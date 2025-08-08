from typing import Any, Callable

from . import custom_tools


REGISTRY: dict[str, Callable[..., Any]] = {
    name: fn
    for name, fn in vars(custom_tools).items()
    if callable(fn) and name not in {"call_custom_tool"}
}


def has(name: str) -> bool:
    return name in REGISTRY


def call(name: str, **kwargs):
    if not has(name):
        raise KeyError(f"Tool '{name}' not found")
    return REGISTRY[name](**kwargs)



