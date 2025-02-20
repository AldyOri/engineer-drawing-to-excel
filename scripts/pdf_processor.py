import pymupdf
import sys
import os

ALLOWED_LAYERS = ["0", "AM_0", "Border (ISO)", "Title (ISO)", "Hatch (ISO)","DESC", "SYMS", "XREF"]

def process_pdf(input_path: str, output_path: str) -> None:
    try:
        # Open source PDF
        doc = pymupdf.open(input_path)
        
        xref_ocg_on = []
        xref_ocg_off = []

        # Process OCGs (layers) if exist
        try:
            ocgs = doc.get_ocgs()
            if ocgs:
                print("Available layers:", {k: v['name'] for k, v in ocgs.items()})
                for xref, layer_info in ocgs.items():
                    layer_name = layer_info['name'].strip("'")  # Remove quotes if present
                    if layer_name in ALLOWED_LAYERS:
                        # Enable allowed layers
                        xref_ocg_on.append(xref)
                    else:
                        # Disable unwanted layers
                        xref_ocg_off.append(xref)
                print(f"Enabled list: {xref_ocg_on}")
                print(f"Disabled list: {xref_ocg_off}")
                doc.set_layer(config=-1, on=xref_ocg_on, off=xref_ocg_off, locked=xref_ocg_off+xref_ocg_on)
            else:
                print("Document has no layers (optional content)")

        except Exception as layer_error:
            print(f"Warning: Could not process layers: {str(layer_error)}")
        
        # Keep only first page
        if doc.page_count > 1:
            doc.delete_pages(from_page=1, to_page=doc.page_count-1)
            
        # Save with optimization and close
        doc.save(output_path, garbage=3, deflate=True)
        doc.close()

        print(f"Successfully processed: {os.path.basename(input_path)}")

    except Exception as e:
        print(f"Error processing {input_path}: {str(e)}", file=sys.stderr)
        sys.exit(1)

def main():
    if len(sys.argv) != 3:
        print("Usage: python pdf_processor.py <input_path> <output_path>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    process_pdf(input_path, output_path)

if __name__ == "__main__":
    main()