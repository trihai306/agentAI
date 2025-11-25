<?php

namespace App\Http\Services\ModelProviders;

use App\Services\OpenAIService;
use App\Services\GeminiService;
use App\Services\ClaudeService;
use Illuminate\Support\Facades\Log;

class ModelProviderFactory
{
    private OpenAIService $openAIService;
    private GeminiService $geminiService;
    private ClaudeService $claudeService;

    public function __construct(
        OpenAIService $openAIService,
        GeminiService $geminiService,
        ClaudeService $claudeService
    ) {
        $this->openAIService = $openAIService;
        $this->geminiService = $geminiService;
        $this->claudeService = $claudeService;
    }

    /**
     * Create model provider based on provider name
     *
     * @param string $provider Provider name: 'openai', 'gemini', 'claude'
     * @return ModelProviderInterface
     * @throws \InvalidArgumentException
     */
    public function create(string $provider): ModelProviderInterface
    {
        return match($provider) {
            'openai' => new OpenAIProvider($this->openAIService),
            'gemini' => new GeminiProvider($this->geminiService),
            'google' => new GeminiProvider($this->geminiService), // Alias for gemini
            'claude' => new ClaudeProvider($this->claudeService),
            'anthropic' => new ClaudeProvider($this->claudeService), // Alias for claude
            default => throw new \InvalidArgumentException("Unsupported provider: {$provider}")
        };
    }

    /**
     * Get default provider from config
     *
     * @return string
     */
    public function getDefaultProvider(): string
    {
        return config('services.ai.provider', 'openai');
    }
}

