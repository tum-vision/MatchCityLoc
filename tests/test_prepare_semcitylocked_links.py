"""Public dataset preparation must dereference snapshot-cache symlinks."""
import errno
from unittest.mock import patch

import pytest

from scripts.prepare_semcitylocked import link_or_copy


def test_snapshot_symlink_links_the_blob(tmp_path):
    blob = tmp_path / 'cache' / 'blobs' / 'image'
    blob.parent.mkdir(parents=True)
    blob.write_bytes(b'public image fixture')
    source = tmp_path / 'cache' / 'snapshots' / 'revision' / 'image.jpg'
    source.parent.mkdir(parents=True)
    source.symlink_to('../../blobs/image')
    target = tmp_path / 'prepared' / 'image.jpg'
    link_or_copy(source, target)
    assert target.is_file()
    assert not target.is_symlink()
    assert target.samefile(blob)
    assert target.read_bytes() == blob.read_bytes()
    assert source.is_symlink()


def test_snapshot_symlink_cross_device_copy(tmp_path):
    blob = tmp_path / 'blob'
    blob.write_bytes(b'public model fixture')
    source = tmp_path / 'source'
    source.symlink_to('blob')
    target = tmp_path / 'prepared' / 'model.obj'
    with patch('scripts.prepare_semcitylocked.os.link', side_effect=OSError(errno.EXDEV, 'cross-device')):
        link_or_copy(source, target)
    assert target.is_file() and not target.is_symlink()
    assert target.read_bytes() == blob.read_bytes()


def test_existing_file_is_preserved(tmp_path):
    source, target = tmp_path / 'source', tmp_path / 'target'
    source.write_bytes(b'new')
    target.write_bytes(b'existing')
    link_or_copy(source, target)
    assert target.read_bytes() == b'existing'


def test_dangling_existing_link_is_reported_and_preserved(tmp_path):
    source, target = tmp_path / 'source', tmp_path / 'target'
    source.write_bytes(b'new')
    target.symlink_to('missing')
    with pytest.raises(RuntimeError, match='Use a new preparation directory'):
        link_or_copy(source, target)
    assert target.is_symlink() and str(target.readlink()) == 'missing'


def test_missing_source_does_not_create_target(tmp_path):
    target = tmp_path / 'prepared' / 'target'
    with pytest.raises(FileNotFoundError):
        link_or_copy(tmp_path / 'missing', target)
    assert not target.exists()
