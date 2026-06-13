"use client";

import { useEffect, useState } from "react";
import { CustomerCredit } from "@/components/customers/customer-credit";
import axiosInstance from "@/lib/api/axios-config";

interface CustomerCreditPageProps {
  params: {
    id: string;
  };
}

export default function CustomerCreditPage({ params }: CustomerCreditPageProps) {
  const [customerName, setCustomerName] = useState<string>("Loading...");

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await axiosInstance.get(`/api/customer/customers/${params.id}/`);
        const data = res.data;
        const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || `Customer #${params.id}`;
        setCustomerName(name);
      } catch {
        setCustomerName(`Customer #${params.id}`);
      }
    };
    fetchCustomer();
  }, [params.id]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Customer Credit</h1>
      </div>

      <CustomerCredit customerId={params.id} customerName={customerName} />
    </div>
  );
}
