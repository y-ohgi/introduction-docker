<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Faker\Factory as Faker;

use App\Book;

class BooksController extends Controller
{
    public function index()
    {
        return response()->json(Book::all());
    }

    public function store()
    {
        $book = new Book();
        $book->title = "tmp title"; // Faker::create()->name();
        $book->save();

        return response()->json($book);
    }
}
