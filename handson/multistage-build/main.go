package main

import (
	"fmt"
	"log"
	"net/http"
)

func index(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "Hello")
}

func main() {
	server := http.Server{
		Addr:    "0.0.0.0:8080",
		Handler: nil,
	}

	http.HandleFunc("/", index)

	log.Fatal(server.ListenAndServe())
}
