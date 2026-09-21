<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('projects', function (Blueprint $table) {
        $table->id();

        $table->foreignId('ngo_profile_id')
            ->constrained('ngo_profiles')
            ->cascadeOnDelete();

        $table->string('title');
        $table->text('description');

        $table->string('location')->nullable();

        $table->dateTime('start_at');
        $table->dateTime('end_at');

        $table->unsignedInteger('capacity');

        $table->json('required_skills')->nullable();
        $table->json('required_interests')->nullable();

        $table->enum('status', [
            'draft',
            'submitted',
            'published',
            'closed',
            'rejected',
        ])->default('draft');

        $table->enum('risk_level', [
            'low',
            'medium',
            'high',
        ])->default('low');

        $table->text('rejection_reason')->nullable();

        $table->timestamps();
    });
}
    public function down(): void
{
    Schema::dropIfExists('projects');
}
};
