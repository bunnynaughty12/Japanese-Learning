"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ExamIdRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/dasboardAdmin/exams");
    }, [router]);
    return null;
}
