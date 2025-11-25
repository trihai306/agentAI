<?php

namespace App\Services;

use App\Repositories\Contracts\DeviceRepositoryInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class DeviceService
{
    private const AGENT_BRIDGE_URL = 'http://127.0.0.1:3001';
    private const TIMEOUT = 5;

    protected DeviceRepositoryInterface $deviceRepository;

    public function __construct(DeviceRepositoryInterface $deviceRepository)
    {
        $this->deviceRepository = $deviceRepository;
    }

    /**
     * Sync devices from Agent Bridge to database.
     */
    public function syncDevices(): array
    {
        try {
            $response = Http::timeout(self::TIMEOUT)->get(self::AGENT_BRIDGE_URL . '/api/devices');

            if (!$response->successful()) {
                Log::warning('DeviceService: Failed to connect to Agent Bridge', [
                    'status' => $response->status(),
                ]);
                return [
                    'success' => false,
                    'message' => 'Không thể kết nối đến Agent Bridge',
                    'devices' => [],
                ];
            }

            $data = $response->json();
            $devices = $data['devices'] ?? [];

            // Filter only connected devices
            $connectedDevices = array_filter($devices, function($device) {
                return isset($device['status']) && $device['status'] === 'device';
            });

            $synced = 0;
            $updated = 0;

            foreach ($connectedDevices as $deviceData) {
                $udid = $deviceData['udid'] ?? $deviceData['id'] ?? null;

                if (!$udid) {
                    continue;
                }

                $device = $this->deviceRepository->findByUdid($udid);
                $isNew = !$device;

                if ($isNew) {
                    $device = $this->deviceRepository->findOrCreateByUdid($udid, [
                        'name' => $deviceData['name'] ?? $deviceData['model'] ?? 'Unknown Device',
                        'model' => $deviceData['model'] ?? 'Unknown',
                        'platform' => $this->normalizePlatform($deviceData['platform'] ?? 'unknown'),
                        'version' => $deviceData['version'] ?? 'Unknown',
                        'status' => $deviceData['status'] ?? 'unknown',
                        'screen_size' => $deviceData['screen_size'] ?? null,
                        'orientation' => $deviceData['orientation'] ?? null,
                        'is_active' => true,
                        'last_seen_at' => Carbon::now(),
                        'metadata' => array_merge($deviceData['metadata'] ?? [], [
                            'last_sync' => Carbon::now()->toIso8601String(),
                        ]),
                    ]);
                    $synced++;
                } else {
                    // Merge metadata
                    $existingMetadata = $device->metadata ?? [];
                    $newMetadata = $deviceData['metadata'] ?? [];

                    $this->deviceRepository->update($device, [
                        'name' => $deviceData['name'] ?? $deviceData['model'] ?? $device->name,
                        'model' => $deviceData['model'] ?? $device->model,
                        'platform' => $this->normalizePlatform($deviceData['platform'] ?? $device->platform),
                        'version' => $deviceData['version'] ?? $device->version,
                        'status' => $deviceData['status'] ?? $device->status,
                        'screen_size' => $deviceData['screen_size'] ?? $device->screen_size,
                        'orientation' => $deviceData['orientation'] ?? $device->orientation,
                        'last_seen_at' => Carbon::now(),
                        'is_active' => true,
                        'metadata' => array_merge($existingMetadata, $newMetadata, [
                            'last_sync' => Carbon::now()->toIso8601String(),
                        ]),
                    ]);
                    $updated++;
                }
            }

            // Mark devices as offline if not seen in last sync
            $activeUdids = array_filter(array_column($connectedDevices, 'udid'));
            $this->deviceRepository->markOfflineByUdids($activeUdids);

            return [
                'success' => true,
                'message' => 'Đồng bộ thành công',
                'devices' => $connectedDevices,
                'synced' => $synced,
                'updated' => $updated,
            ];
        } catch (\Exception $e) {
            Log::error('DeviceService: Error syncing devices', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi đồng bộ thiết bị: ' . $e->getMessage(),
                'devices' => [],
            ];
        }
    }

    /**
     * Normalize platform name.
     */
    private function normalizePlatform(?string $platform): string
    {
        if (!$platform) {
            return 'unknown';
        }

        $platform = strtolower($platform);

        if (str_contains($platform, 'android')) {
            return 'android';
        }

        if (str_contains($platform, 'ios') || str_contains($platform, 'iphone') || str_contains($platform, 'ipad')) {
            return 'ios';
        }

        return 'unknown';
    }


    /**
     * Check Agent Bridge connection.
     */
    public function checkConnection(): bool
    {
        try {
            $response = Http::timeout(3)->get(self::AGENT_BRIDGE_URL . '/health');
            return $response->successful() && ($response->json()['status'] ?? null) === 'ok';
        } catch (\Exception $e) {
            return false;
        }
    }
}

