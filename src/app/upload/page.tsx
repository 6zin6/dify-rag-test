import DocumentManager from '@/components/DocumentManager';

export default function UploadPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <DocumentManager />
      </div>
    </div>
  );
}
