import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Test Frame - Farcaster Tipping Bot',
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': '/api/frames/images/welcome',
    'fc:frame:button:1': 'Test Bahşiş 💰',
    'fc:frame:button:1:action': 'post',
    'fc:frame:button:2': 'Ana Sayfa 🏠',
    'fc:frame:button:2:action': 'post',
    'fc:frame:post_url': '/api/frame-actions',
  },
};

export default function TestFrame() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🧪 Test Frame
        </h1>
        <p className="text-gray-600 mb-6">
          Bu sayfa Farcaster frame olarak test edilmek için oluşturulmuştur.
        </p>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Frame Meta Tags:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✅ fc:frame: vNext</li>
              <li>✅ fc:frame:image</li>
              <li>✅ fc:frame:button:1</li>
              <li>✅ fc:frame:button:2</li>
              <li>✅ fc:frame:post_url</li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">Test Adımları:</h3>
            <ol className="text-sm text-green-700 space-y-1 text-left">
              <li>1. Bu URL'yi Farcaster'da paylaş</li>
              <li>2. Frame'in düzgün görüntülendiğini kontrol et</li>
              <li>3. Butonlara tıklayarak test et</li>
            </ol>
          </div>
        </div>
        
        <div className="mt-6 p-3 bg-gray-100 rounded text-sm text-gray-600">
          <strong>Test URL:</strong><br/>
          <code className="break-all">
            {typeof window !== 'undefined' ? window.location.href : '/test-frame'}
          </code>
        </div>
      </div>
    </div>
  );
}