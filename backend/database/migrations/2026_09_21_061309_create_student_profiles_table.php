<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_profiles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->unique()
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('campus_id')
                ->nullable()
                ->constrained('campuses')
                ->nullOnDelete();

            $table->string('nim', 100)->nullable();
            $table->string('study_program')->nullable();

            $table->json('interests')->nullable();
            $table->json('skills')->nullable();
            $table->json('availability')->nullable();

            $table->string('location')->nullable();

            $table->unsignedTinyInteger('profile_completion')
                ->default(0);

            $table->timestamps();

            $table->index('nim');
            $table->index('campus_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_profiles');
    }
};