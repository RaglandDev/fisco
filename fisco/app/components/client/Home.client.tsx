"use client";
import { TestDataType } from "@/types/Home.client"

type Props = {
  testData: TestDataType[];
};

export default function ClientHome({ testData }: Props) {
  return (
    <ul>
      {testData.map((item) => (
        <li key={item.id}>{item.id}</li>
      ))}
    </ul>
  );
}
