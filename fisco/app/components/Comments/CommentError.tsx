import React from "react";
import { errorStyles } from "@/components/Comments/styles";

interface CommentErrorProps {
  error: string | null;
}

export function CommentError({ error }: CommentErrorProps) {
  if (!error) return null;

  return (
    <div className={errorStyles.container}>
      <p className={errorStyles.text}>{error}</p>
    </div>
  );
}