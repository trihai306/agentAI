<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class LandingController extends Controller
{
    /**
     * Show the landing page
     */
    public function index(): Response
    {
        return Inertia::render('Landing');
    }
}

