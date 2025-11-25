<?php

namespace App\Http\Services\ModelProviders;

use App\Services\OpenAIService;
use Illuminate\Support\Facades\Log;

class OpenAIProvider implements ModelProviderInterface
{
    private OpenAIService $service;

    public function __construct(OpenAIService $service)
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

