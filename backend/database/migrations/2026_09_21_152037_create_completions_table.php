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
    Schema::create('completions', function (Blueprint $table) {
        $table->id();

        $table->foreignId('application_id')
            ->constrained('applications')
            ->cascadeOnDelete();

        $table->enum('status', [
            'confirmed',
            'cancelled',
        ])->default('confirmed');

        $table->timestamp('confirmed_at')->nullable();

        $table->text('notes')->nullable();

        $table->timestamps();

        // Satu application hanya boleh punya satu completion
        $table->unique('application_id');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('completions');
    }
};
