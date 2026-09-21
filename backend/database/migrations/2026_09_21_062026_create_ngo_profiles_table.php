<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ngo_profiles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->unique()
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('organization_name');
            $table->text('description')->nullable();

            $table->json('focus_areas')->nullable();

            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->text('address')->nullable();

            $table->string('verification_tier')
                ->default('tier_2');

            $table->string('verification_status')
                ->default('submitted');

            $table->string('risk_level')
                ->default('low');

            $table->timestamps();

            $table->index('verification_tier');
            $table->index('verification_status');
            $table->index('risk_level');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ngo_profiles');
    }
};