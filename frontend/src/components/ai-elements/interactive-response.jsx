import { useIframeListener } from '@/hooks/useIframeListener';
import {
  WebPreview,
  WebPreviewNavigation,
  WebPreviewUrl,
  WebPreviewBody,
  WebPreviewNavigationButton, 
} from '@/components/ai-elements/web-preview';
import { ArrowLeftIcon, ArrowRightIcon, RotateCwIcon } from 'lucide-react';
export function InteractiveWebMessage({ appPart }) {
  // Extract the data from the message part
  const app = appPart || {};
  const appUrl = app.url || app.src || 'about:blank';
  const sourceCode = app.sourceCode;
  const height = app.height || '400px';
  const width = app.width || '1800px';

  const handleDataFromIframe = (data) => {
    console.log('🎉 MESSAGE RECEIVED FROM IFRAME:', data);
  };

  useIframeListener(handleDataFromIframe);

  return (
    <WebPreview defaultUrl={appUrl} style={{ height, width }} className="w-full">
      {/* --- 2. UPDATE THE NAVIGATION SECTION --- */}
      <WebPreviewNavigation className='border-4 border-white'>
        <WebPreviewNavigationButton
          tooltip="Back"
          onClick={() => alert('Back button clicked!')}
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </WebPreviewNavigationButton>
        <WebPreviewNavigationButton
          tooltip="Forward"
          onClick={() => alert('Forward button clicked!')}
        >
          <ArrowRightIcon className="h-4 w-4" />
        </WebPreviewNavigationButton>
        <WebPreviewNavigationButton
          tooltip="Refresh"
          onClick={() => alert('Refresh button clicked!')}
        >
          <RotateCwIcon className="h-4 w-4" />
        </WebPreviewNavigationButton>

        <WebPreviewUrl src={appUrl} />
        
      </WebPreviewNavigation>
      <WebPreviewBody src={appUrl} srcDoc={sourceCode} />
    </WebPreview>
  );
}
