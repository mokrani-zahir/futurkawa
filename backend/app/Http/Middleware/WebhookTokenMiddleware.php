<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class WebhookTokenMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $expected = config('futurekawa.webhook_token');
        $provided = $request->header('Authorization');

        if (empty($expected) || $provided !== $expected) {
            return response()->json(['message' => 'Token webhook invalide.'], 401);
        }

        return $next($request);
    }
}
