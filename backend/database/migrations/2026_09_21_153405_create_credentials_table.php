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
    Schema::create('credentials', function (Blueprint $table) {
        $table->id();

        $table->foreignId('application_id')
            ->constrained('applications')
            ->cascadeOnDelete();

        $table->string('credential_number')->unique();

        $table->string('title');

        $table->timestamp('issued_at');

        $table->enum('status', [
            'active',
            'revoked',
        ])->default('active');

        $table->timestamp('revoked_at')->nullable();

        $table->text('revocation_reason')->nullable();

        $table->timestamps();

        // Satu application hanya boleh memiliki satu credential
        $table->unique('application_id');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('credentials');
    }
};
