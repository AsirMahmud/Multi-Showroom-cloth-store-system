"use client";

import { ProductHistory } from "@/components/product/product-history"
import { PageHeader } from "@/components/ui/professional"
import { History, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function ProductHistoryPage({ params }: { params: { id: string } }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <PageHeader
        title="Inventory Lifecycle"
        description="Detailed chronological analysis of product movement and transaction history."
        icon={<History className="h-6 w-6" />}
        actions={
          <Link href="/inventory">
            <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-primary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Catalog
            </Button>
          </Link>
        }
      />

      <motion.div variants={item}>
        <ProductHistory productId={params.id} showHeader={false} />
      </motion.div>
    </motion.div>
  )
}
