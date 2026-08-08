#!/usr/bin/env python3
"""Home Finder MCP Server — exposes SQLite DB as MCP tools."""
import asyncio, json, sqlite3, sys
from mcp.server import Server
from mcp.types import TextContent, Tool

DB = "/app/data/homefinder.db"

def db_query(sql, bindings=()):
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute(sql, bindings)
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows

def db_exec(sql, bindings=()):
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute(sql, bindings)
    conn.commit()
    last = c.lastrowid
    conn.close()
    return last

TOOLS = {
    "search_listings": {
        "description": "Search listings by filters (price, beds, baths, city, state, etc.)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "min_price": {"type": "number"},
                "max_price": {"type": "number"},
                "beds": {"type": "integer"},
                "baths": {"type": "number"},
                "city": {"type": "string"},
                "state": {"type": "string"},
                "limit": {"type": "integer", "default": 50},
            },
        },
    },
    "get_listing": {
        "description": "Get a single listing by ID",
        "inputSchema": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
            },
            "required": ["id"],
        },
    },
    "get_favorites": {
        "description": "Get all favorited listings",
        "inputSchema": {"type": "object", "properties": {}},
    },
    "add_favorite": {
        "description": "Favorite a listing by ID",
        "inputSchema": {
            "type": "object",
            "properties": {"id": {"type": "integer"}},
            "required": ["id"],
        },
    },
    "remove_favorite": {
        "description": "Remove a favorite by listing ID",
        "inputSchema": {
            "type": "object",
            "properties": {"id": {"type": "integer"}},
            "required": ["id"],
        },
    },
    "get_saved_searches": {
        "description": "Get all saved searches",
        "inputSchema": {"type": "object", "properties": {}},
    },
    "get_market_stats": {
        "description": "Get aggregate market statistics (count, avg/min/max price)",
        "inputSchema": {"type": "object", "properties": {}},
    },
}

app = Server("homefinder")

@app.list_tools()
async def list_tools():
    return [Tool(name=k, **v) for k, v in TOOLS.items()]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "search_listings":
        where = ["1=1"]
        params = []
        for k in ("min_price", "max_price", "beds", "baths"):
            if arguments.get(k) is not None:
                col = k.replace("min_", "").replace("max_", "")
                if k.startswith("min_"):
                    where.append(f"{col} >= ?")
                elif k.startswith("max_"):
                    where.append(f"{col} <= ?")
                else:
                    where.append(f"{col} = ?")
                params.append(arguments[k])
        for k in ("city", "state"):
            if arguments.get(k):
                where.append(f"{k} = ?")
                params.append(arguments[k])
        sql = f"SELECT * FROM listings WHERE {' AND '.join(where)} ORDER BY price LIMIT ?"
        params.append(arguments.get("limit", 50))
        rows = db_query(sql, params)
        return [TextContent(type="text", text=json.dumps(rows, indent=2))]

    elif name == "get_listing":
        rows = db_query("SELECT * FROM listings WHERE id = ?", (arguments["id"],))
        return [TextContent(type="text", text=json.dumps(rows[0] if rows else {}, indent=2))]

    elif name == "get_favorites":
        rows = db_query("SELECT l.* FROM listings l JOIN favorites f ON f.listing_id = l.id")
        return [TextContent(type="text", text=json.dumps(rows, indent=2))]

    elif name == "add_favorite":
        db_exec("INSERT OR IGNORE INTO favorites (listing_id) VALUES (?)", (arguments["id"],))
        return [TextContent(type="text", text=json.dumps({"ok": True, "listing_id": arguments["id"]}))]

    elif name == "remove_favorite":
        db_exec("DELETE FROM favorites WHERE listing_id = ?", (arguments["id"],))
        return [TextContent(type="text", text=json.dumps({"ok": True, "listing_id": arguments["id"]}))]

    elif name == "get_saved_searches":
        rows = db_query("SELECT * FROM saved_searches")
        return [TextContent(type="text", text=json.dumps(rows, indent=2))]

    elif name == "get_market_stats":
        rows = db_query("SELECT COUNT(*) as total, ROUND(AVG(price),2) as avg_price, MIN(price) as min_price, MAX(price) as max_price FROM listings")
        return [TextContent(type="text", text=json.dumps(rows[0] if rows else {}, indent=2))]

    return [TextContent(type="text", text=json.dumps({"error": "unknown tool"}))]

if __name__ == "__main__":
    from mcp.server.stdio import stdio_server
    asyncio.run(stdio_server(app))
