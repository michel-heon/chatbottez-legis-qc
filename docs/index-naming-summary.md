# 🏷️ Index Name Management - Summary

## Files Added/Modified

### New Scripts
- `scripts/index-name-set.sh` - Assigns custom index names with validation
- `scripts/index-config-list.sh` - Lists all current index configurations

### Modified Scripts
- `scripts/index-setup.sh` - Now supports custom index names
- `scripts/index-delete.sh` - Now supports custom index names  
- `scripts/index-status-check.sh` - Now supports custom index names
- `scripts/documents-add.sh` - Now supports custom index names

### Modified Files
- `Makefile` - Added `index-name-set` and `index-config-list` rules
- `docs/azure-search-management.md` - Updated with index naming documentation

## New Makefile Commands

```bash
# Set custom index name
make index-name-set INDEX_NAME=my-custom-index ENVIRONMENT=local

# List all configurations
make index-config-list
```

## Configuration Priority

1. **Environment Variable**: `AZURE_SEARCH_INDEX_NAME`
2. **Script Config**: `scripts/.index-config`
3. **Default**: `my-documents`

## Index Name Validation

- Length: 2-128 characters
- Format: lowercase letters, numbers, hyphens only
- Must start/end with alphanumeric characters

## Examples

```bash
# Valid names
make index-name-set INDEX_NAME=legis-qc-documents
make index-name-set INDEX_NAME=my-index-v2
make index-name-set INDEX_NAME=docs-2024

# Invalid names (will be rejected)
make index-name-set INDEX_NAME=My-Index        # uppercase
make index-name-set INDEX_NAME=-invalid-       # starts with hyphen
make index-name-set INDEX_NAME=Index_With_Under # underscores
```

## Configuration Files

- `scripts/.index-config` - Script-level configuration
- `env/.env.{environment}.user` - Environment-specific settings
- `package.json` - npm configuration (if jq available)

## Integration

All existing index management commands now automatically use the configured index name:
- `make index-setup`
- `make index-delete`
- `make index-status`
- `make documents-add`
- `make index-reindex`
