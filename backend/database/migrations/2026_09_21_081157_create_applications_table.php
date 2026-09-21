<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('applications', function (Blueprint $table) {
        $table->id();

        $table->foreignId('project_id')
            ->constrained('projects')
            ->cascadeOnDelete();

        $table->foreignId('student_profile_id')
            ->constrained('student_profiles')
            ->cascadeOnDelete();

        $table->text('motivation')->nullable();

        $table->enum('status', [
            'pending',
            'accepted',
            'rejected',
            'withdrawn',
        ])->default('pending');

        $table->timestamp('applied_at')->nullable();

        $table->timestamp('reviewed_at')->nullable();

        $table->text('rejection_reason')->nullable();

        $table->timestamps();

        // Satu student tidak boleh apply project yang sama dua kali
        $table->unique([
            'project_id',
            'student_profile_id',
        ]);
    });
}

    public function down(): void
{
    Schema::dropIfExists('applications');
}
};
