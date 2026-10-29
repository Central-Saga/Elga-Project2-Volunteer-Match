<?php

namespace App\Support;

use App\Http\Requests\PaginationRequest;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Collection;

class ApiPagination
{
    /**
     * Existing clients receive the complete list. Pagination is enabled
     * when the caller supplies page or per_page.
     */
    private static function options(PaginationRequest $request): array
    {
        $values = $request->validated();

        return [
            $request->exists('page') || $request->exists('per_page'),
            (int) ($values['page'] ?? 1),
            (int) ($values['per_page'] ?? 20),
        ];
    }

    public static function collection(PaginationRequest $request, Collection $items): array
    {
        [$enabled, $page, $perPage] = self::options($request);
        $total = $items->count();

        if (! $enabled) {
            $page = 1;
            $perPage = max(1, $total);
        }

        $data = $enabled
            ? $items->forPage($page, $perPage)->values()->all()
            : $items->values()->all();

        return [
            'data' => $data,
            'meta' => [
                'current_page' => $page,
                'last_page' => max(1, (int) ceil($total / $perPage)),
                'per_page' => $perPage,
                'total' => $total,
            ],
        ];
    }

    public static function query(PaginationRequest $request, Builder|Relation $query): array
    {
        [$enabled, $page, $perPage] = self::options($request);

        if (! $enabled) {
            $items = $query->get();
            $total = $items->count();

            return [
                'data' => $items,
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => max(1, $total),
                    'total' => $total,
                ],
            ];
        }

        $result = $query->paginate($perPage, ['*'], 'page', $page);

        return [
            'data' => $result->items(),
            'meta' => [
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'per_page' => $result->perPage(),
                'total' => $result->total(),
            ],
        ];
    }
}
