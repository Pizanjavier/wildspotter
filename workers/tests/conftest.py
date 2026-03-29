"""Shared test fixtures. Mocks heavy dependencies so pure logic can be tested
without psycopg2, tensorflow, etc. installed on the host."""

import sys
import os
import types

# Add workers directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Create a mock utils module so workers can import without psycopg2
mock_utils = types.ModuleType("utils")
mock_utils.get_db_connection = lambda: None  # type: ignore[attr-defined]
mock_utils.setup_logging = lambda name, level=None: __import__("logging").getLogger(name)  # type: ignore[attr-defined]
mock_utils.lat_lon_to_tile = lambda lat, lon, zoom: (0, 0, zoom)  # type: ignore[attr-defined]
mock_utils.tile_bounds = lambda x, y, z: (0, 0, 0, 0)  # type: ignore[attr-defined]
sys.modules["utils"] = mock_utils
