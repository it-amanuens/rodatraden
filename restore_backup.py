#!/usr/bin/env python
"""
Restore backup utility for Röda Tråden

This script restores a backup created with `python manage.py backup`.
Usage:
    python restore_backup.py <path_to_backup.zip>
    
The script will:
1. Extract the backup ZIP file
2. Run database migrations
3. Load the database dump (data.json)
4. Extract media files to the media/ folder
"""

import os
import sys
import shutil
import zipfile
from pathlib import Path


def restore_backup(backup_path, project_root=None):
    """
    Restore a backup from a ZIP file.
    
    Args:
        backup_path: Path to the backup ZIP file
        project_root: Path to project root (defaults to current directory)
    """
    backup_path = Path(backup_path)
    if project_root is None:
        project_root = Path.cwd()
    else:
        project_root = Path(project_root)

    # Validation
    if not backup_path.exists():
        print(f'❌ Error: Backup file not found: {backup_path}')
        return False

    if not backup_path.suffix == '.zip':
        print(f'❌ Error: Backup file must be a ZIP archive')
        return False

    if not (project_root / 'manage.py').exists():
        print(f'❌ Error: manage.py not found in {project_root}')
        print('   Make sure you run this from the project root directory')
        return False

    print('='*60)
    print('RESTORE BACKUP')
    print('='*60)
    print(f'Backup file: {backup_path}')
    print(f'Project root: {project_root}')
    print()

    # Step 1: Create extract directory
    extract_dir = project_root / '.backup_extract_temp'
    if extract_dir.exists():
        shutil.rmtree(extract_dir)
    extract_dir.mkdir()

    try:
        # Step 2: Extract backup
        print('📦 Extracting backup...')
        with zipfile.ZipFile(backup_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
        print('✓ Backup extracted')

        # Step 3: Check for required files
        data_json = extract_dir / 'data.json'
        if not data_json.exists():
            print('❌ Error: data.json not found in backup')
            return False

        # Step 4: Restore database (requires Django management)
        print()
        print('🗄️  Restoring database...')
        print('   Step 1: Running migrations...')
        os.system(f'cd {project_root} && python manage.py migrate')

        print('   Step 2: Loading data dump...')
        os.system(f'cd {project_root} && python manage.py loaddata {data_json}')
        print('✓ Database restored')

        # Step 5: Restore media files
        media_in_backup = extract_dir / 'media'
        if media_in_backup.exists():
            print()
            print('📁 Restoring media files...')
            media_root = project_root / 'media'

            # Restore profiles
            profiles_src = media_in_backup / 'profiles'
            if profiles_src.exists():
                profiles_dst = media_root / 'profiles'
                if profiles_dst.exists():
                    shutil.rmtree(profiles_dst)
                shutil.copytree(profiles_src, profiles_dst)
                profile_count = len(list(profiles_dst.glob('*')))
                print(f'✓ Restored {profile_count} profile images')

            # Restore isp_templates
            templates_src = media_in_backup / 'isp_templates'
            if templates_src.exists():
                templates_dst = media_root / 'isp_templates'
                if templates_dst.exists():
                    shutil.rmtree(templates_dst)
                shutil.copytree(templates_src, templates_dst)
                print('✓ Restored ISP templates')
        else:
            print()
            print('⚠ No media folder in backup (database-only backup)')

        # Success message
        print()
        print('='*60)
        print('✓ RESTORE COMPLETE')
        print('='*60)
        print()
        print('Your Röda Tråden instance has been restored!')
        print('Start the development server: python manage.py runserver')
        return True

    except Exception as e:
        print(f'❌ Error during restore: {e}')
        return False

    finally:
        # Cleanup
        if extract_dir.exists():
            shutil.rmtree(extract_dir)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python restore_backup.py <path_to_backup.zip>')
        print()
        print('Example:')
        print('  python restore_backup.py backups/backup_2026-05-14_14-30-45.zip')
        sys.exit(1)

    backup_file = sys.argv[1]
    success = restore_backup(backup_file)
    sys.exit(0 if success else 1)
