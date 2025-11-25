<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->json('tool_calls')->nullable()->after('content');
            $table->integer('iterations')->default(0)->after('tool_calls');
            $table->string('device_id')->nullable()->after('iterations');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['tool_calls', 'iterations', 'device_id']);
        });
    }
};
