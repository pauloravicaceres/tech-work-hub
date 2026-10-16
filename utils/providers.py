# -*- coding: utf-8 -*-
"""
utils/providers.py
Patrón Strategy y Factory para soporte Multi-Provider LLM (Claude, Agy, Codex).
Cumple con principios SOLID (específicamente Open/Closed Principle - OCP).
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Type


class ProviderStrategy(ABC):
    """Clase base abstracta para estrategias de proveedores LLM."""

    @abstractmethod
    def get_herdr_start_args(self, workspace_dir: Any, model: str, effort: str) -> List[str]:
        """Devuelve los argumentos específicos para inyectar en 'herdr agent start' después del '--'."""
        pass

    @abstractmethod
    def get_headless_cmd(self, model: str = None, effort: str = None) -> List[str]:
        """Devuelve el comando base y banderas de seguridad para ejecuciones en background (SpecKit)."""
        pass

    def get_prompt_flag(self) -> str:
        """Devuelve la bandera CLI para adjuntar el archivo de directiva o prompt del sistema."""
        return "--append-system-prompt-file"


class ClaudeProvider(ProviderStrategy):
    """Estrategia para el proveedor Claude."""

    def get_herdr_start_args(self, workspace_dir: Any, model: str, effort: str) -> List[str]:
        return [
            "--dangerously-skip-permissions",
            "--add-dir", str(workspace_dir),
            "--model", str(model),
            "--effort", str(effort),
        ]

    def get_headless_cmd(self, model: str = None, effort: str = None) -> List[str]:
        cmd = ["claude", "-p", "--dangerously-skip-permissions"]
        if model:
            cmd.extend(["--model", str(model)])
        if effort:
            cmd.extend(["--effort", str(effort)])
        return cmd


class AgyProvider(ProviderStrategy):
    """Estrategia para el proveedor Antigravity (Agy)."""

    def get_herdr_start_args(self, workspace_dir: Any, model: str, effort: str) -> List[str]:
        cmd = [
            "--dangerously-skip-permissions",
            "--add-dir", str(workspace_dir),
            "--model", str(model),
        ]
        if effort:
            cmd.extend(["--effort", str(effort)])
        return cmd

    def get_headless_cmd(self, model: str = None, effort: str = None) -> List[str]:
        cmd = ["agy", "-p", "--dangerously-skip-permissions"]
        if model:
            cmd.extend(["--model", str(model)])
        if effort:
            cmd.extend(["--effort", str(effort)])
        return cmd

    def get_prompt_flag(self) -> str:
        return ""


class CodexProvider(ProviderStrategy):
    """Estrategia para el proveedor OpenAI Codex."""

    def get_herdr_start_args(self, workspace_dir: Any, model: str, effort: str) -> List[str]:
        cmd = [
            "-a", "never",
            "-s", "workspace-write",
            "--add-dir", str(workspace_dir),
            "--model", str(model),
        ]
        if effort:
            cmd.extend(["-c", f'model_reasoning_effort="{effort}"'])
        return cmd

    def get_headless_cmd(self, model: str = None, effort: str = None) -> List[str]:
        cmd = ["codex", "exec", "-a", "never", "-s", "workspace-write", "--dangerously-bypass-approvals-and-sandbox"]
        if model:
            cmd.extend(["-m", str(model)])
        if effort:
            cmd.extend(["-c", f'model_reasoning_effort="{effort}"'])
        return cmd

    def get_prompt_flag(self) -> str:
        return ""


class ProviderFactory:
    """
    Fábrica para instanciar la estrategia correspondiente según el nombre del proveedor.
    Soporta registro extensible para cumplir con el Principio Abierto/Cerrado (OCP).
    """

    _registry: Dict[str, Type[ProviderStrategy]] = {
        "claude": ClaudeProvider,
        "agy": AgyProvider,
        "codex": CodexProvider,
    }

    @classmethod
    def register_provider(cls, name: str, strategy_cls: Type[ProviderStrategy]) -> None:
        """Registra una nueva estrategia de proveedor sin modificar el código base."""
        cls._registry[name.lower()] = strategy_cls

    @classmethod
    def get_provider(cls, name: str = "claude") -> ProviderStrategy:
        """Devuelve una instancia de la estrategia del proveedor."""
        provider_name = (name or "claude").lower()
        strategy_cls = cls._registry.get(provider_name)
        if not strategy_cls:
            disponibles = ", ".join(cls._registry.keys())
            raise ValueError(f"Proveedor '{name}' no soportado. Proveedores disponibles: {disponibles}")
        return strategy_cls()
