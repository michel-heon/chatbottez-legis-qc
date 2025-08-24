#!/bin/bash

# Script to populate data directory with 3 random files from each directory A-V
# Usage: ./scripts/data-populate.sh

set -e

# Configuration
SOURCE_BASE="/media/psf/Developpement/00-GIT/cotechnoe-kb-legis-qc/etl/extract/pdf"
TARGET_DIR="src/indexers/data"
FILES_PER_DIR=3

echo "📁 Populating data directory with random PDF files..."
echo "   Source: $SOURCE_BASE"
echo "   Target: $TARGET_DIR"
echo "   Files per directory: $FILES_PER_DIR"
echo ""

# Clean and create target directory
echo "🧹 Cleaning target directory..."
rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"

# Track statistics
total_copied=0
total_dirs_processed=0

# Process each directory A-V
for dir_letter in A B C D E F G H I J L M N O P Q R S T U V; do
    source_dir="$SOURCE_BASE/$dir_letter"
    
    if [ ! -d "$source_dir" ]; then
        echo "⚠️  Directory $dir_letter not found, skipping..."
        continue
    fi
    
    # Get list of PDF files in the directory
    pdf_files=($(find "$source_dir" -name "*.pdf" -type f 2>/dev/null | head -20))
    pdf_count=${#pdf_files[@]}
    
    if [ $pdf_count -eq 0 ]; then
        echo "⚠️  No PDF files found in directory $dir_letter, skipping..."
        continue
    fi
    
    echo "📂 Processing directory $dir_letter ($pdf_count PDFs available)..."
    
    # Determine how many files to copy (up to FILES_PER_DIR)
    files_to_copy=$FILES_PER_DIR
    if [ $pdf_count -lt $files_to_copy ]; then
        files_to_copy=$pdf_count
    fi
    
    # Shuffle and take the first N files for randomness
    # Use a more compatible approach for shuffling
    if command -v shuf &> /dev/null; then
        selected_files=($(printf '%s\n' "${pdf_files[@]}" | shuf | head -$files_to_copy))
    else
        # Fallback: use sort with random
        selected_files=($(printf '%s\n' "${pdf_files[@]}" | sort -R | head -$files_to_copy))
    fi
    
    # Copy selected files
    for file in "${selected_files[@]}"; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            cp "$file" "$TARGET_DIR/"
            echo "   ✅ Copied: $filename"
            total_copied=$((total_copied + 1))
        fi
    done
    
    total_dirs_processed=$((total_dirs_processed + 1))
done

echo ""
echo "📊 Population completed!"
echo "   Directories processed: $total_dirs_processed"
echo "   Total files copied: $total_copied"
echo "   Target directory: $TARGET_DIR"

# Verify results
actual_files=$(find "$TARGET_DIR" -name "*.pdf" -type f | wc -l)
echo "   Files in target: $actual_files"

if [ $actual_files -gt 0 ]; then
    echo ""
    echo "🎯 Sample of copied files:"
    ls -la "$TARGET_DIR"/*.pdf | head -5 | while read line; do
        echo "   $line"
    done
    
    if [ $actual_files -gt 5 ]; then
        echo "   ... and $(($actual_files - 5)) more files"
    fi
    
    echo ""
    echo "✅ Data population successful!"
else
    echo ""
    echo "❌ No files were copied. Please check source directory and permissions."
    exit 1
fi
