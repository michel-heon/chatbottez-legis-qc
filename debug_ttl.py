#!/usr/bin/env python3

import sys
from rdflib import Graph

def debug_ttl_structure(ttl_file_path):
    """Debug TTL file structure to understand why we're not finding 6 documents"""
    print(f'📂 Loading TTL file: {ttl_file_path}')
    
    # Create RDF graph and load TTL file
    g = Graph()
    try:
        g.parse(ttl_file_path, format='turtle')
        print(f'✅ Successfully loaded RDF graph with {len(g)} triples')
    except Exception as e:
        print(f'❌ Failed to parse TTL file: {e}')
        return
    
    # Debug: Show first few triples to understand structure
    print('\n🔍 Sample triples from the graph:')
    for i, (s, p, o) in enumerate(g):
        if i < 15:
            print(f'  {i+1:2d}. {s} -> {p} -> {o}')
        else:
            break
    
    # Find all unique predicates
    predicates = set()
    for s, p, o in g:
        predicates.add(str(p))
    
    print(f'\n📋 Found {len(predicates)} unique predicates:')
    for pred in sorted(predicates):
        print(f'  - {pred}')
    
    # Find all unique types
    types = set()
    subjects_by_type = {}
    for s, p, o in g:
        if 'type' in str(p) or str(p).endswith('#type') or str(p).endswith('/type'):
            types.add(str(o))
            if str(o) not in subjects_by_type:
                subjects_by_type[str(o)] = []
            subjects_by_type[str(o)].append(str(s))
    
    print(f'\n🏷️ Found {len(types)} unique types:')
    for typ in sorted(types):
        count = len(subjects_by_type.get(typ, []))
        print(f'  - {typ} ({count} instances)')
        if count <= 10:  # Show subjects for small counts
            for subj in subjects_by_type.get(typ, []):
                print(f'    • {subj}')
    
    # Simple approach: find all subjects that have a title
    print('\n🔍 Looking for subjects with titles...')
    title_query = '''
    PREFIX dcterms: <http://purl.org/dc/terms/>
    
    SELECT DISTINCT ?doc ?title
    WHERE {
        ?doc dcterms:title ?title .
    }
    ORDER BY ?doc
    '''
    
    title_results = g.query(title_query)
    print(f'📊 Found {len(title_results)} subjects with titles:')
    
    for i, (doc_uri, title) in enumerate(title_results):
        print(f'  {i+1}. {doc_uri}')
        print(f'     📝 Title: {title}')
        
        # Get all properties for this document
        prop_query = f'''
        SELECT ?p ?o WHERE {{
            <{doc_uri}> ?p ?o .
        }}
        '''
        
        props = {}
        for prop, value in g.query(prop_query):
            prop_str = str(prop)
            value_str = str(value)
            
            if 'status' in prop_str:
                props['status'] = value_str
            elif 'abrogatedBy' in prop_str:
                props['abrogatedBy'] = value_str
            elif 'enrichmentMethod' in prop_str:
                props['enrichmentMethod'] = value_str
            elif 'description' in prop_str:
                props['description'] = value_str[:100] + '...' if len(value_str) > 100 else value_str
        
        for key, value in props.items():
            print(f'     {key}: {value}')
        print()

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print('Usage: python3 debug_ttl.py <ttl_file_path>')
        sys.exit(1)
    
    debug_ttl_structure(sys.argv[1])
