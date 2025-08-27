#!/bin/bash

# Migrate existing files to subdirectory structure
# This script moves files from flat structure to organized subdirectories

source "${BASH_SOURCE%/*}/load-env.sh"

echo "🔄 Migrating existing files to subdirectory structure..."

# Function to migrate files in a directory
migrate_files() {
    local source_dir="$1"
    local description="$2"
    
    if [ ! -d "$source_dir" ]; then
        echo "⚠️  Directory not found: $source_dir"
        return
    fi
    
    echo "📁 Migrating $description files in: $source_dir"
    
    # Count files to migrate
    local files_to_migrate=$(find "$source_dir" -maxdepth 1 -name "*.json" -not -name "errors.log" | wc -l)
    
    if [ "$files_to_migrate" -eq 0 ]; then
        echo "ℹ️  No $description files to migrate"
        return
    fi
    
    echo "📊 Found $files_to_migrate $description files to migrate"
    
    # Create subdirectories A-Z
    for letter in {A..Z}; do
        mkdir -p "$source_dir/$letter"
    done
    
    # Migrate files
    local migrated_count=0
    for file in "$source_dir"/*.json; do
        if [ -f "$file" ] && [ "$(basename "$file")" != "errors.log" ]; then
            local filename=$(basename "$file")
            local first_letter=$(echo "$filename" | cut -c1 | tr '[:lower:]' '[:upper:]')
            
            # Skip if first character is not a letter
            if [[ ! "$first_letter" =~ [A-Z] ]]; then
                echo "⚠️  Skipping $filename (does not start with a letter)"
                continue
            fi
            
            local target_dir="$source_dir/$first_letter"
            local target_file="$target_dir/$filename"
            
            if [ ! -f "$target_file" ]; then
                mv "$file" "$target_file"
                echo "✅ Moved: $filename → $first_letter/$filename"
                ((migrated_count++))
            else
                echo "⚠️  Target already exists: $first_letter/$filename"
            fi
        fi
    done
    
    echo "📊 Migrated $migrated_count $description files"
    echo ""
}

# Migrate processed files
PROCESSED_DIR="${EXTERNAL_DATA_SOURCE_PATH}/transform/processed"
migrate_files "$PROCESSED_DIR" "processed"

# Migrate embedding files
EMBEDDINGS_DIR="${EXTERNAL_DATA_SOURCE_PATH}/transform/embeddings"
migrate_files "$EMBEDDINGS_DIR" "embedding"

echo "🎉 Migration completed!"
echo ""
echo "📋 Final Structure:"
echo "Processed files:"
find "$PROCESSED_DIR" -name "*.json" -not -name "errors.log" | wc -l | xargs echo "  Total:"

echo "Embedding files:"
find "$EMBEDDINGS_DIR" -name "*.json" | wc -l | xargs echo "  Total:"

echo ""
echo "📁 Directory structure:"
for letter in {A..Z}; do
    processed_count=$(find "$PROCESSED_DIR/$letter" -name "*.json" 2>/dev/null | wc -l)
    embedding_count=$(find "$EMBEDDINGS_DIR/$letter" -name "*.json" 2>/dev/null | wc -l)
    
    if [ "$processed_count" -gt 0 ] || [ "$embedding_count" -gt 0 ]; then
        echo "  $letter/: $processed_count processed, $embedding_count embeddings"
    fi
done
