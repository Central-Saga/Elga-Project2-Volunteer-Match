<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Http\Resources\NotificationResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = Notification::where(
            'user_id',
            $request->user()->id
        )
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Notifications retrieved successfully.',
            'data' => NotificationResource::collection($notifications)->resolve($request),
            'meta' => [
                'unread_count' => $notifications
                    ->where('is_read', false)
                    ->count(),
            ],
        ]);
    }

    public function markAsRead(
        Request $request,
        Notification $notification
    ) {
        Gate::authorize('update', $notification);

        if (!$notification->is_read) {
            $notification->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Notification marked as read.',
            'data' => (new NotificationResource($notification->fresh()))->resolve($request),
        ]);
    }

    public function markAllAsRead(Request $request)
    {
        Notification::where(
            'user_id',
            $request->user()->id
        )
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'message' => 'All notifications marked as read.',
        ]);
    }
}