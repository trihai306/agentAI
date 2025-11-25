<?php

namespace App\Http\Services\ModelProviders;

use App\Services\GeminiService;
use Illuminate\Support\Facades\Log;

class GeminiProvider implements ModelProviderInterface
{
    private GeminiService $service;

    public function __construct(GeminiService $service)
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

