"use client";

export default function ClientHome({ testData }) {
  return (
    <ul>
      {testData.map((item) => (
        <li key={item.id}>{item.id}</li>
      ))}
    </ul>
  );
}
