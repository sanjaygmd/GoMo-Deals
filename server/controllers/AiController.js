import { Client } from "@gradio/client";

// Helper function to fetch a URL or base64 data URI and convert it to a Blob
const getBlob = async (imageSource) => {
    try {
        const response = await fetch(imageSource);
        if (!response.ok) throw new Error("Failed to fetch image source.");
        return await response.blob();
    } catch (err) {
        console.error("Error fetching blob for image source:", err.message);
        throw err;
    }
};

const generateVirtualTryOn = async (req, res) => {
  try {
    const { humanImage, garmentImage, category = 'upper_body' } = req.body;

    if (!humanImage || !garmentImage) {
      return res.status(400).json({ success: false, message: 'Both human image and garment image are required.' });
    }

    console.log("Starting Virtual Try-On generation via free Hugging Face API (yisol/IDM-VTON)...");

    // Convert image sources to Blobs for Gradio
    const humanBlob = await getBlob(humanImage);
    const garmentBlob = await getBlob(garmentImage);

    console.log("Images converted to blobs. Connecting to Hugging Face Space...");

    // Connect to the public space
    const client = await Client.connect("yisol/IDM-VTON");

    console.log("Connected to Hugging Face. Submitting to queue (this may take a few minutes)...");
    
    // Submit prediction to the /tryon endpoint.
    // The IDM-VTON Gradio interface expects an ImageEditor dictionary for the first input.
    const result = await client.predict("/tryon", [
        { "background": humanBlob, "layers": [], "composite": null }, // Person image (ImageEditor format)
        garmentBlob,    // Garment image
        "clothing",     // Description of garment
        true,           // Use auto-crop (Change crop elements as False)
        true,           // Use auto-crop
        30,             // Denoising Steps
        42,             // Seed
    ]);

    console.log("Virtual Try-On generation successful.");

    // The result from Gradio is usually an object containing the output files.
    let imageUrl = "";
    if (result.data && result.data[0]) {
        if (result.data[0].url) {
            imageUrl = result.data[0].url; // Usually Gradio returns a .url property
        } else if (typeof result.data[0] === 'string') {
            imageUrl = result.data[0]; 
        } else {
            console.log("Unexpected result format from Gradio:", JSON.stringify(result.data));
            return res.status(500).json({ success: false, message: "Invalid response format from Hugging Face." });
        }
    } else {
        throw new Error("No data returned from Hugging Face API.");
    }

    return res.status(200).json({
      success: true,
      imageUrl: imageUrl
    });

  } catch (error) {
    console.error("Error generating Virtual Try-On:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate image via AI.",
    });
  }
};

export default {
  generateVirtualTryOn
};
