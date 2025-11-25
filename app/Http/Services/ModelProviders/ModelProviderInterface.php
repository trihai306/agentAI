<?php

namespace App\Http\Services\ModelProviders;

interface ModelProviderInterface
{
    /**
     * Chat with AI model
     *
     * @param array $messages Messages array
     * @param array|null $tools Tools array
     * @param string|null $model Model name
     * @return array|null Response array with 'content' and 'tool_calls'
     */
    public function chat(array $messages, ?array $tools = null, ?string $model = null): ?array;

    /**
     * Generate MCP tools definition for the provider
     *
     * @param array $mcpTools MCP tools array
     * @return array Tools definition in provider format
     */
    public function generateMcpToolsDefinition(array $mcpTools): array;
}

