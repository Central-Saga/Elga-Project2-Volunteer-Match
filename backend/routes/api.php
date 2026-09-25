<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CampusProfileController;
use App\Http\Controllers\Api\NgoProfileController;
use App\Http\Controllers\Api\StudentProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NgoProjectController;
use App\Http\Controllers\NgoProjectSubmissionController;
use App\Http\Controllers\AdminProjectReviewController;
use App\Http\Controllers\StudentProjectController;
use App\Http\Controllers\StudentApplicationController;
use App\Http\Controllers\NgoApplicationController;
use App\Http\Controllers\NgoApplicationReviewController;
use App\Http\Controllers\StudentAttendanceController;
use App\Http\Controllers\NgoAttendanceController;
use App\Http\Controllers\NgoCompletionController;
use App\Http\Controllers\NgoCredentialController;
use App\Http\Controllers\StudentCredentialController;
use App\Http\Controllers\CredentialVerificationController;
use App\Http\Controllers\AdminCredentialController;
use App\Http\Controllers\CampusCredentialController;
use App\Http\Controllers\CampusCredentialReportController;
use App\Http\Controllers\AdminNgoVerificationController;
use App\Http\Controllers\NotificationController;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::get(
    '/credentials/verify/{credentialNumber}',
    [CredentialVerificationController::class, 'verify']
);

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/notifications', [
    NotificationController::class,
    'index'
]);

Route::post('/notifications/{notification}/read', [
    NotificationController::class,
    'markAsRead'
]);

Route::post('/notifications/read-all', [
    NotificationController::class,
    'markAllAsRead'
]);

    /*
    |--------------------------------------------------------------------------
    | Student
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:student')->prefix('student')->group(function () {
        Route::get('/profile', [StudentProfileController::class, 'show']);
        Route::put('/profile', [StudentProfileController::class, 'update']);
        Route::get('/projects', [StudentProjectController::class, 'index']);
        Route::get('/projects/{project}', [StudentProjectController::class, 'show']);
        Route::post('/projects/{project}/apply',[StudentApplicationController::class, 'store']);
        Route::get('/applications',[StudentApplicationController::class, 'index']);
        Route::post('/applications/{application}/check-in',[StudentAttendanceController::class, 'checkIn']);
        Route::get('/applications/{application}/attendance',[StudentAttendanceController::class, 'show']);
        Route::get('/applications/{application}/credential',[StudentCredentialController::class, 'show']);
    });

    /*
    |--------------------------------------------------------------------------
    | NGO
    |--------------------------------------------------------------------------
    */

   Route::middleware('role:ngo')->prefix('ngo')->group(function () {

    Route::get('/profile', [\App\Http\Controllers\Api\NgoProfileController::class,'show',]);

    Route::put('/profile', [\App\Http\Controllers\Api\NgoProfileController::class,'update',]);

    Route::get('/verification', [\App\Http\Controllers\Api\NgoVerificationController::class,'show',]);

    Route::post('/verification', [\App\Http\Controllers\Api\NgoVerificationController::class,'submit',]);

    Route::get('/projects', [NgoProjectController::class, 'index']);
    Route::post('/projects', [NgoProjectController::class, 'store']);

    Route::post('/projects/{project}/submit',[NgoProjectSubmissionController::class, 'submit']);

    Route::get('/projects/{project}/applications',[NgoApplicationController::class, 'index']);

    Route::post('/applications/{application}/accept',[NgoApplicationReviewController::class, 'accept']);

    Route::post('/applications/{application}/reject',[NgoApplicationReviewController::class, 'reject']);

    Route::post('/attendances/{attendance}/validate',[NgoAttendanceController::class, 'validateAttendance']);

    Route::post('/applications/{application}/confirm-completion',[NgoCompletionController::class, 'confirm']);

    Route::post('/applications/{application}/credential',[NgoCredentialController::class, 'issue']);
});

    /*
    |--------------------------------------------------------------------------
    | Campus
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:campus')->prefix('campus')->group(function () {
        Route::get('/profile', [CampusProfileController::class, 'show']);
        Route::put('/profile', [CampusProfileController::class, 'update']);
        Route::get('/credentials/verify/{credentialNumber}',[CampusCredentialController::class, 'verify']);
        Route::get('/credentials',[CampusCredentialReportController::class, 'index']);
        Route::get('/reports/volunteer-activities',[CampusCredentialReportController::class, 'volunteerActivities']);
        Route::get('/reports/volunteer-activities/export',[CampusCredentialReportController::class, 'exportVolunteerActivities']);
    });

     /*
    |--------------------------------------------------------------------------
    | Admin
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:admin')->prefix('admin')->group(function () {
    Route::get('/projects/submitted', [
        AdminProjectReviewController::class,
        'index',
    ]);

    Route::post('/projects/{project}/approve', [
        AdminProjectReviewController::class,
        'approve',
    ]);

    Route::post('/projects/{project}/reject', [
        AdminProjectReviewController::class,
        'reject',
    ]);

    Route::get('/credentials',
    [AdminCredentialController::class, 'index']
    );

    Route::post('/credentials/{credential}/revoke',
        [AdminCredentialController::class, 'revoke'
    ]);

    Route::get('/ngos/verifications',
        [AdminNgoVerificationController::class, 'index']
    );

    Route::post('/ngos/verifications/{verification}/approve',
        [AdminNgoVerificationController::class, 'approve']
    );

    Route::post('/ngos/verifications/{verification}/reject',
        [AdminNgoVerificationController::class, 'reject']
    );
});
});