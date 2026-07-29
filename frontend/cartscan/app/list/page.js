import { Suspense } from "react";
import ListPage from "../../components/ListPage";

export default function List() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Chargement...</p></div>}>
      <ListPage />
    </Suspense>
  );
} 

