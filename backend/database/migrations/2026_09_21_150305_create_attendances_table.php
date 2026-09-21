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
    Schema::create('attendances', function (Blueprint $table) {
        $table->id();

        $table->foreignId('application_id')
            ->constrained('applications')
            ->cascadeOnDelete();

        $table->enum('status', [
            'checked_in',
            'validated',
            'absent',
        ])->default('checked_in');

        $table->timestamp('checked_in_at')->nullable();
        $table->timestamp('checked_out_at')->nullable();
        $table->timestamp('validated_at')->nullable();

        $table->timestamps();

        // Satu application hanya punya satu attendance record
        $table->unique('application_id');
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
