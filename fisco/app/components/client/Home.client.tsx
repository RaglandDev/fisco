"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Post } from "@/types/index";

const POSTS_PER_PAGE = 3;


export default function ClientHome(){
    console.log("it's here!");
    return (
        <>
            <div>
                <h1>alice</h1>
                <h1>Hi!</h1>
            </div>
        </>
        
    );
}
