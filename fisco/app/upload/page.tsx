import ImageUpload from '../components/server/ImageUpload.server';
import { Button } from "@/components/ui/button";

function UploadPage() {
    return (
    
      <div>
        {/* <Button variant="default">
          <span>New Post</span>
        </Button> */}
        <ImageUpload /> 
      </div>
    );
  }
  
  export default UploadPage;
  