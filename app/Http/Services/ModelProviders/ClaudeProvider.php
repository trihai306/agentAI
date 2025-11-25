<?php

namespace App\Http\Services\ModelProviders;

use App\Services\ClaudeService;
use Illuminate\Support\Facades\Log;

class ClaudeProvider implements ModelProviderInterface
{
    private ClaudeService $service;

    public function __construct(ClaudeService $service)
    {
        $this->service = $service;
    }

    public function chat(array $messages, ?array $tools = null, ?string $model = null): ?array
    {
        return $this->service->chat($messages, $tools, $model);
    }

    public function generateMcpToolsDefinition(array $mcpTools): array
    {
        return $this->service->generateMcpToolsDefinition($mcpTools);
    }
}

