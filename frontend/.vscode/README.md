# VS Code Configuration

## Local JSON Schemas

This folder contains local JSON schema files to solve the issue with loading remote schemas from schemastore.org. The following schemas are included:

- `schemas/package.schema.json`: Schema for package.json files
- `schemas/tsconfig.schema.json`: Schema for tsconfig.json files

## Why Local Schemas?

The project was encountering errors when trying to load schemas from remote URLs:

```
Problems loading reference 'https://json.schemastore.org/package': Unable to load schema
Problems loading reference 'https://json.schemastore.org/tsconfig': Unable to load schema
```

By using local schemas, we avoid network-related issues and ensure consistent validation even when offline.

## How It Works

The `settings.json` file configures VS Code to use these local schemas instead of the remote ones. This provides:

1. Faster validation (no network requests)
2. Consistent behavior (works offline)
3. No error messages about unreachable schemas

## Customization

If you need to add more schemas or update existing ones, you can:

1. Add new schema files to the `schemas` directory
2. Update the `settings.json` file to reference the new schemas