import discord
from discord.ext import commands
import aiosqlite
import os
from dotenv import load_dotenv
import asyncio
from datetime import datetime, UTC # Import UTC from datetime

# Load environment variables from .env file
load_dotenv()

# Configure bot with appropriate intents
intents = discord.Intents.default()
intents.message_content = True  # Required for reading message content
intents.members = True  # Optional: for member management features

# Create bot instance with command prefix
bot = commands.Bot(command_prefix='!', intents=intents, help_command=None)

# Database configuration
DB_NAME = 'book_club_queue.db'

# --- Database Setup Functions ---
async def init_db():
    """Initialize the SQLite database with required tables."""
    async with aiosqlite.connect(DB_NAME) as db:
        # Create members table with enhanced schema
        await db.execute('''
            CREATE TABLE IF NOT EXISTS members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                position INTEGER NOT NULL,
                join_date TEXT NOT NULL,
                pick_count INTEGER DEFAULT 0,
                last_pick_date TEXT,
                current_picker_since TEXT
            )
        ''')
        
        # Create activity log table for tracking queue changes
        await db.execute('''
            CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                action TEXT NOT NULL,
                member_name TEXT,
                details TEXT
            )
        ''')
        
        # Add new columns to existing members table if they don't exist
        # This handles upgrades from Phase 1
        try:
            await db.execute('ALTER TABLE members ADD COLUMN pick_count INTEGER DEFAULT 0')
        except:
            pass  # Column already exists
        
        try:
            await db.execute('ALTER TABLE members ADD COLUMN last_pick_date TEXT')
        except:
            pass  # Column already exists
            
        try:
            await db.execute('ALTER TABLE members ADD COLUMN current_picker_since TEXT')
        except:
            pass  # Column already exists
        
        # Set current picker timestamp for existing data
        cursor = await db.execute('SELECT id FROM members WHERE position = 1 AND current_picker_since IS NULL')
        current_picker = await cursor.fetchone()
        if current_picker:
            await db.execute(
                'UPDATE members SET current_picker_since = ? WHERE id = ?',
                (datetime.now(UTC).isoformat(), current_picker[0])
            )
        
        await db.commit()
        print("Database tables created/updated successfully.")

async def enable_wal_mode():
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute('PRAGMA journal_mode=WAL;')
        await db.commit()
        print(f"WAL mode enabled for {DB_NAME}")

async def log_activity(action, member_name=None, details=None, additional_data=None):
    """Log queue activity for history tracking."""
    async with aiosqlite.connect(DB_NAME) as db:
        timestamp = datetime.now(UTC).isoformat()
        
        # Create detailed log entry
        log_details = details
        if additional_data:
            log_details = f"{details} | {additional_data}" if details else additional_data
            
        await db.execute(
            'INSERT INTO activity_log (timestamp, action, member_name, details) VALUES (?, ?, ?, ?)',
            (timestamp, action, member_name, log_details)
        )
        await db.commit()

# --- Bot Events ---
@bot.event
async def on_ready():
    print(f'Bot logged in as: {bot.user.name} (ID: {bot.user.id})')
    print('Bot is ready and online!')
    
    await init_db()
    print('Database initialized successfully.')
    
    # --- ADD THIS LINE ---
    await enable_wal_mode() 
    print('WAL mode enabled.')
    # ---------------------
    print([c.name for c in bot.commands if c.name == "defer"])
    
    await log_activity("BOT_STARTUP", details=f"Bot {bot.user.name} started successfully")

@bot.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.MissingRequiredArgument):
        command_help = {
            'add': "❓ I need a name to add to the queue!\n**Usage:** `!add [member name]`\n**Example:** `!add Sarah Johnson`",
            'remove': "❓ I need a name to remove from the queue!\n**Usage:** `!remove [member name]`\n**Example:** `!remove David`",
            'defer': "❓ I need to know who is deferring their turn!\n**Usage:** `!defer [current picker name]`\n**Example:** `!defer Alice`\n**Note:** Only the current picker can defer their turn.",
            'stats': "💡 You can use `!stats` for general statistics or `!stats [member name]` for specific member info.",
            'history': "💡 You can use `!history` for recent activity or `!history [number]` to specify how many entries to show."
        }
        
        message = command_help.get(ctx.command.name, 
                                f"❓ Missing required argument for command `{ctx.command.name}`.\n"
                                f"Use `!help {ctx.command.name}` for usage information.")
        
        await ctx.send(message)
    
    elif isinstance(error, commands.BadArgument):
        if ctx.command.name == 'history':
            await ctx.send("❓ Please provide a valid number for history limit.\n"
                          "**Example:** `!history 15`")
        elif ctx.command.name == 'stats':
            await ctx.send("❓ Please provide a valid member name.\n"
                          "**Example:** `!stats Sarah Johnson`")
        else:
            await ctx.send(f"❓ Invalid argument for command `{ctx.command.name}`.\n"
                          f"Use `!help {ctx.command.name}` for usage information.")
    
    elif isinstance(error, commands.CommandNotFound):
        # Silently ignore unknown commands to avoid spam
        pass
    
    elif isinstance(error, commands.CommandOnCooldown):
        await ctx.send(f"⏰ Command is on cooldown. Try again in {error.retry_after:.1f} seconds.")
    
    else:
        # Log unexpected errors for debugging
        print(f"Unexpected error in command {ctx.command}: {error}")
        await ctx.send("⚠️ An unexpected error occurred while processing your command. "
                      "Please try again later.")

# --- Helper Functions ---

async def display_queue(ctx):
    """Display the current book club queue with enhanced formatting."""
    async with aiosqlite.connect(DB_NAME) as db:
        cursor = await db.execute(
            'SELECT name, position, current_picker_since FROM members ORDER BY position ASC'
        )
        members = await cursor.fetchall()
        
        if not members:
            embed = discord.Embed(
                title="📋 Fiction Book Club Queue",
                description="The book club queue is currently empty.\nUse `!add [member name]` to add members!",
                color=0x95a5a6
            )
            await ctx.send(embed=embed)
            return
        
        # Build queue display with enhanced formatting
        queue_text = ""
        for i, (name, position, current_picker_since) in enumerate(members):
            if i == 0:  # First member is always the current picker
                picker_info = "👑 **" + name + "** (currently picking)"
                if current_picker_since:
                    try:
                        picker_since_dt = datetime.fromisoformat(current_picker_since.replace('Z', '+00:00'))
                        days_picking = (datetime.now(UTC) - picker_since_dt).days
                        if days_picking > 0:
                            picker_info += f" - {days_picking} days"
                    except:
                        pass
                queue_text += f"{position}. {picker_info}\n"
            else:
                queue_text += f"{position}. {name}\n"
        
        embed = discord.Embed(
            title="📋 Fiction Book Club Queue",
            description=queue_text,
            color=0x3498db,
            timestamp=datetime.now(UTC)
        )
        
        # Add helpful footer
        embed.set_footer(text=f"Total members: {len(members)} | Use !help for commands")
        
        await ctx.send(embed=embed)

# --- Core Commands ---

@bot.command(name='add')
async def add_member(ctx, *, member_name: str):
    """Add a new member to the end of the queue."""
    # Normalize the member name (title case for consistency)
    member_name = member_name.strip().title()
    
    async with aiosqlite.connect(DB_NAME) as db:
        # Check if member already exists
        cursor = await db.execute('SELECT name FROM members WHERE LOWER(name) = LOWER(?)', (member_name,))
        existing_member = await cursor.fetchone()
        
        if existing_member:
            await ctx.send(f"⚠️ **{member_name}** is already in the queue.\n"
                          f"Use `!queue` to see the current queue.")
            return
        
        # Get the current maximum position to add to the end
        cursor = await db.execute('SELECT MAX(position) FROM members')
        max_position_result = await cursor.fetchone()
        max_position = max_position_result[0] if max_position_result[0] is not None else 0
        new_position = max_position + 1
        
        # Insert new member with join date
        join_date = datetime.now(UTC).isoformat()
        await db.execute(
            'INSERT INTO members (name, position, join_date) VALUES (?, ?, ?)',
            (member_name, new_position, join_date)
        )
        await db.commit()
        
        # Log the activity
        await log_activity("MEMBER_ADDED", member_name, f"Added at position {new_position}")
        
        # Send confirmation
        await ctx.send(f"✅ Added **{member_name}** to the queue at position **{new_position}**.")
        
        # Display updated queue
        await display_queue(ctx)

@bot.command(name='remove')
async def remove_member(ctx, *, member_name: str):
    """Remove a member from the queue and adjust positions."""
    # Normalize the member name
    member_name = member_name.strip().title()
    
    async with aiosqlite.connect(DB_NAME) as db:
        # Find the member to remove (case-insensitive search)
        cursor = await db.execute('SELECT id, name, position FROM members WHERE LOWER(name) = LOWER(?)', (member_name,))
        member_to_remove = await cursor.fetchone()
        
        if not member_to_remove:
            await ctx.send(f"❓ I couldn't find **{member_name}** in the queue.")
            
            # Show current members as a helpful hint
            cursor = await db.execute('SELECT name FROM members ORDER BY position ASC')
            current_members = await cursor.fetchall()
            if current_members:
                member_list = ", ".join([member[0] for member in current_members])
                await ctx.send(f"**Current members:** {member_list}")
            
            return
        
        member_id, actual_name, old_position = member_to_remove
        
        # Delete the member
        await db.execute('DELETE FROM members WHERE id = ?', (member_id,))
        
        # Adjust positions of members who were after the removed member
        await db.execute('UPDATE members SET position = position - 1 WHERE position > ?', (old_position,))
        await db.commit()
        
        # Log the activity
        await log_activity("MEMBER_REMOVED", actual_name, f"Removed from position {old_position}")
        
        # Send confirmation
        await ctx.send(f"✅ Removed **{actual_name}** from the queue.\n"
                      f"All members after position {old_position} moved up one position.")
        
        # Display updated queue
        await display_queue(ctx)

@bot.command(name='queue')
async def queue_command(ctx):
    """Display the current book club queue."""
    await display_queue(ctx)

@bot.command(name='next')
async def next_picker(ctx):
    """Advance the queue to the next picker."""
    async with aiosqlite.connect(DB_NAME) as db:
        # Get current picker (position 1)
        cursor = await db.execute('SELECT id, name FROM members WHERE position = 1')
        current_picker = await cursor.fetchone()
        
        if not current_picker:
            await ctx.send("❓ The queue is empty! Add members with `!add [member name]` first.")
            return
        
        current_picker_id, current_picker_name = current_picker
        
        # Get total number of members
        cursor = await db.execute('SELECT COUNT(*) FROM members')
        total_members = (await cursor.fetchone())[0]
        
        if total_members == 1:
            # Special case: only one member
            await ctx.send(f"📚 **{current_picker_name}** has finished picking!\n"
                          f"Since they're the only member, they remain the current picker. 👑")
            
            # Update their pick count and last pick date
            await db.execute(
                'UPDATE members SET pick_count = pick_count + 1, last_pick_date = ?, current_picker_since = ? WHERE id = ?',
                (datetime.now(UTC).isoformat(), datetime.now(UTC).isoformat(), current_picker_id)
            )
            await db.commit()
            
            await log_activity("PICK_COMPLETED", current_picker_name, "Only member - remains current picker")
            return
          
        # Move everyone else up one position
        await db.execute('UPDATE members SET position = position - 1 WHERE position > 1')
        
        # Move current picker to the end
        await db.execute('UPDATE members SET position = ? WHERE id = ?', (total_members, current_picker_id))
               
        # Update pick statistics for the member who just finished
        await db.execute(
            'UPDATE members SET pick_count = pick_count + 1, last_pick_date = ?, current_picker_since = NULL WHERE id = ?',
            (datetime.now(UTC).isoformat(), current_picker_id)
        )
        
        # Set the new current picker timestamp
        cursor = await db.execute('SELECT id, name FROM members WHERE position = 1')
        new_picker = await cursor.fetchone()
        new_picker_id, new_picker_name = new_picker
        
        await db.execute(
            'UPDATE members SET current_picker_since = ? WHERE id = ?',
            (datetime.now(UTC).isoformat(), new_picker_id)
        )
        
        await db.commit()
        
        # Log the activity
        await log_activity("QUEUE_ADVANCED", current_picker_name, 
                          f"Moved to end, {new_picker_name} is now picking")
        
        # Create announcement embed
        embed = discord.Embed(
            title="📚 Queue Advanced!",
            color=0x2ecc71,
            timestamp=datetime.now(UTC)
        )
        
        embed.add_field(
            name="Finished Picking",
            value=f"**{current_picker_name}** has completed their turn and moved to the end of the queue.",
            inline=False
        )
        
        embed.add_field(
            name="Now Picking",
            value=f"🎉 **{new_picker_name}**, you're up next to pick a book!",
            inline=False
        )
        
        # Try to mention the new picker if possible
        try:
            # This is a basic mention - in a real implementation, you might want to store Discord user IDs
            embed.add_field(
                name="📢 Notification",
                value=f"@{new_picker_name}, it's your turn!",
                inline=False
            )
        except:
            pass
        
        await ctx.send(embed=embed)
        
        # Display updated queue
        await display_queue(ctx)

@bot.command(name='history')
async def show_history(ctx, limit: int = 10):
    """Show recent queue activity."""
    # Validate limit
    if limit < 1 or limit > 50:
        limit = 10
    
    async with aiosqlite.connect(DB_NAME) as db:
        cursor = await db.execute(
            'SELECT timestamp, action, member_name, details FROM activity_log ORDER BY timestamp DESC LIMIT ?',
            (limit,)
        )
        activities = await cursor.fetchall()
        
        if not activities:
            embed = discord.Embed(
                title="📜 Queue History",
                description="No activity recorded yet.",
                color=0x95a5a6
            )
            await ctx.send(embed=embed)
            return
        
        # Create history embed
        embed = discord.Embed(
            title="📜 Recent Queue Activity",
            color=0x3498db,
            timestamp=datetime.now(UTC)
        )
        
        history_text = ""
        for timestamp, action, member_name, details in activities:
            # Parse timestamp and format it nicely
            try:
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                formatted_time = dt.strftime("%b %d, %I:%M %p")
            except:
                formatted_time = timestamp[:16]  # Fallback formatting
            
            # Format the activity entry
            if action == "MEMBER_ADDED":
                emoji = "➕"
                description = f"Added {member_name}"
            elif action == "MEMBER_REMOVED":
                emoji = "➖"
                description = f"Removed {member_name}"
            elif action == "QUEUE_ADVANCED":
                emoji = "🔄"
                description = f"{member_name} finished picking"
            elif action == "BOT_STARTUP":
                emoji = "🤖"
                description = "Bot started"
            else:
                emoji = "📝"
                description = f"{action}: {member_name or 'System'}"
            
            history_text += f"{emoji} **{formatted_time}** - {description}\n"
            if details and len(details) < 50:  # Only show short details
                history_text += f"   ↳ {details}\n"
            history_text += "\n"
        
        embed.description = history_text
        embed.set_footer(text=f"Showing last {len(activities)} activities")
        
        await ctx.send(embed=embed)        

@bot.command(name='stats')
async def show_stats(ctx, member_name: str = None):
    """Display queue statistics and member information."""
    async with aiosqlite.connect(DB_NAME) as db:
        if member_name:
            # Show stats for specific member
            member_name = member_name.strip().title()
            cursor = await db.execute(
                'SELECT name, position, join_date, pick_count, last_pick_date, current_picker_since FROM members WHERE LOWER(name) = LOWER(?)',
                (member_name,)
            )
            member = await cursor.fetchone()
            
            if not member:
                await ctx.send(f"❓ I couldn't find **{member_name}** in the queue.")
                return
            
            name, position, join_date, pick_count, last_pick_date, current_picker_since = member
            
            embed = discord.Embed(
                title=f"📊 Stats for {name}",
                color=0xe74c3c,
                timestamp=datetime.now(UTC)
            )
            
            embed.add_field(name="Current Position", value=f"#{position}", inline=True)
            embed.add_field(name="Books Picked", value=str(pick_count or 0), inline=True)
            
            # Format join date
            try:
                join_dt = datetime.fromisoformat(join_date.replace('Z', '+00:00'))
                join_formatted = join_dt.strftime("%b %d, %Y")
            except:
                join_formatted = "Unknown"
            embed.add_field(name="Joined", value=join_formatted, inline=True)
            
            # Last pick date
            if last_pick_date:
                try:
                    last_pick_dt = datetime.fromisoformat(last_pick_date.replace('Z', '+00:00'))
                    last_pick_formatted = last_pick_dt.strftime("%b %d, %Y")
                except:
                    last_pick_formatted = "Unknown"
                embed.add_field(name="Last Pick", value=last_pick_formatted, inline=True)
            else:
                embed.add_field(name="Last Pick", value="Never", inline=True)
            
            # Current picker status
            if position == 1:
                if current_picker_since:
                    try:
                        picker_since_dt = datetime.fromisoformat(current_picker_since.replace('Z', '+00:00'))
                        days_picking = (datetime.now(UTC) - picker_since_dt).days
                        embed.add_field(
                            name="Currently Picking",
                            value=f"👑 Yes (for {days_picking} days)",
                            inline=True
                        )
                    except:
                        embed.add_field(name="Currently Picking", value="👑 Yes", inline=True)
                else:
                    embed.add_field(name="Currently Picking", value="👑 Yes", inline=True)
            else:
                embed.add_field(name="Currently Picking", value="No", inline=True)
            
            await ctx.send(embed=embed)
            
        else:
            # Show general queue statistics
            cursor = await db.execute('SELECT COUNT(*) FROM members')
            total_members = (await cursor.fetchone())[0]
            
            if total_members == 0:
                await ctx.send("📊 No statistics available - the queue is empty!")
                return
            
            # Get current picker info
            cursor = await db.execute('SELECT name, current_picker_since FROM members WHERE position = 1')
            current_picker_info = await cursor.fetchone()
            current_picker_name, current_picker_since = current_picker_info if current_picker_info else (None, None)
            
            # Calculate total picks this year
            current_year = datetime.now(UTC).year
            cursor = await db.execute(
                'SELECT COUNT(*) FROM activity_log WHERE action = "QUEUE_ADVANCED" AND timestamp LIKE ?',
                (f"{current_year}%",)
            )
            picks_this_year = (await cursor.fetchone())[0]
            
            # Get member pick statistics
            cursor = await db.execute(
                'SELECT name, pick_count, last_pick_date FROM members ORDER BY pick_count DESC, last_pick_date DESC'
            )
            member_stats = await cursor.fetchall()
            
            embed = discord.Embed(
                title="📊 Book Club Statistics",
                color=0x9b59b6,
                timestamp=datetime.now(UTC)
            )
            
            # General stats
            embed.add_field(name="Total Members", value=str(total_members), inline=True)
            embed.add_field(name="Books Picked This Year", value=str(picks_this_year), inline=True)
            
            # Current picker info
            if current_picker_name:
                picker_text = current_picker_name
                if current_picker_since:
                    try:
                        picker_since_dt = datetime.fromisoformat(current_picker_since.replace('Z', '+00:00'))
                        days_picking = (datetime.now(UTC) - picker_since_dt).days
                        picker_text += f" ({days_picking} days)"
                    except:
                        pass
                embed.add_field(name="Currently Picking", value=f"👑 {picker_text}", inline=True)
            
            # Member pick history (top 5)
            if member_stats:
                pick_history = ""
                for i, (name, pick_count, last_pick_date) in enumerate(member_stats[:5]):
                    pick_count = pick_count or 0
                    if last_pick_date:
                        try:
                            last_pick_dt = datetime.fromisoformat(last_pick_date.replace('Z', '+00:00'))
                            last_pick_formatted = last_pick_dt.strftime("%b %d")
                        except:
                            last_pick_formatted = "Unknown"
                        pick_history += f"• **{name}**: {pick_count} picks (last: {last_pick_formatted})\n"
                    else:
                        pick_history += f"• **{name}**: {pick_count} picks (never picked)\n"
                
                embed.add_field(name="📈 Member Pick History", value=pick_history, inline=False)
            
            await ctx.send(embed=embed)

@bot.command(name='help')
async def help_command(ctx, command_name: str = None):
    """Provide help information for bot commands."""
    if command_name:
        # Specific command help
        command_name = command_name.lower()
        
        help_info = {
            'add': {
                'usage': '!add [member name]',
                'description': 'Add a new member to the end of the queue',
                'examples': ['!add Sarah Johnson', '!add Bob']
            },
            'remove': {
                'usage': '!remove [member name]',
                'description': 'Remove a member from the queue and adjust positions',
                'examples': ['!remove Sarah Johnson', '!remove Bob']
            },
            'queue': {
                'usage': '!queue',
                'description': 'Display the current book club queue',
                'examples': ['!queue']
            },
            'next': {
                'usage': '!next',
                'description': 'Advance the queue - current picker moves to end, next person becomes current picker',
                'examples': ['!next']
            },
            'defer': {
                'usage': '!defer [current picker name]',
                'description': 'Allow the current picker to defer their turn, moving one position back instead of to the end',
                'examples': ['!defer Alice', '!defer Bob Johnson'],
                'note': 'Only the current picker can defer. With 2 members, positions swap. With 3+ members, current picker moves back appropriately.'
            },
            'history': {
                'usage': '!history [limit]',
                'description': 'Show recent queue activity (default: 10 entries, max: 50)',
                'examples': ['!history', '!history 20']
            },
            'stats': {
                'usage': '!stats [member name]',
                'description': 'Show queue statistics or specific member information',
                'examples': ['!stats', '!stats Sarah Johnson']
            }
        }
        
        if command_name in help_info:
            info = help_info[command_name]
            embed = discord.Embed(
                title=f"📖 Help: {command_name}",
                color=0xf39c12
            )
            embed.add_field(name="Usage", value=f"`{info['usage']}`", inline=False)
            embed.add_field(name="Description", value=info['description'], inline=False)
            embed.add_field(name="Examples", value='\n'.join([f"`{ex}`" for ex in info['examples']]), inline=False)
        else:
            embed = discord.Embed(
                title="❓ Unknown Command",
                description=f"I don't have help information for `{command_name}`.\nUse `!help` to see all available commands.",
                color=0xe74c3c
            )
        
        await ctx.send(embed=embed)
    
    else:
        # General help
        embed = discord.Embed(
            title="🤖 Book Club Queue Bot Help",
            description="Manage your book club's picking queue with these commands:",
            color=0x2ecc71
        )
        
        embed.add_field(
            name="📚 Queue Management",
            value=(
                "`!add [name]` - Add member to queue\n"
                "`!remove [name]` - Remove member from queue\n"
                "`!next` - Advance to next picker\n"
                "`!defer [name]` - Current picker defers turn\n"
                "`!queue` - Show current queue"
            ),
            inline=False
        )
        
        embed.add_field(
            name="📊 Information & Statistics",
            value=(
                "`!history [limit]` - Show recent activity\n"
                "`!stats [member]` - Show statistics\n"
                "`!help [command]` - Get detailed help"
            ),
            inline=False
        )
        
        embed.add_field(
            name="💡 Examples",
            value=(
                "`!add Sarah Johnson` - Add Sarah to the queue\n"
                "`!next` - Current picker finishes, advance queue\n"
                "`!stats Sarah Johnson` - Show Sarah's statistics"
            ),
            inline=False
        )
        
        embed.set_footer(text="Use !help [command] for detailed information about a specific command")
        
        await ctx.send(embed=embed)


@bot.command(name='defer')
async def defer_picker(ctx, *, member_name: str):
    """Allow the current picker to defer their turn, moving one position back."""
    # Normalize the member name
    member_name = member_name.strip().title()
    
    async with aiosqlite.connect(DB_NAME) as db:
        # Get total number of members
        cursor = await db.execute('SELECT COUNT(*) FROM members')
        total_members = (await cursor.fetchone())[0]
        
        if total_members == 0:
            await ctx.send("❓ The queue is empty! Add members with `!add [member name]` first.")
            return
        
        if total_members == 1:
            await ctx.send("❓ Cannot defer when there's only one member in the queue.\n"
                          "Add more members first, or use `!next` if the current picker has finished.")
            return
        
        # Get current picker (position 1)
        cursor = await db.execute('SELECT id, name FROM members WHERE position = 1')
        current_picker = await cursor.fetchone()
        
        if not current_picker:
            await ctx.send("❓ No current picker found. This shouldn't happen - please contact an administrator.")
            return
        
        current_picker_id, current_picker_name = current_picker
        
        # Verify that the member to defer is actually the current picker
        if current_picker_name.lower() != member_name.lower():
            await ctx.send(f"❓ **{member_name}** is not the current picker.\n"
                          f"Only **{current_picker_name}** (the current picker) can defer their turn.\n"
                          f"Use `!queue` to see the current queue status.")
            return
        
        # Handle different queue sizes
        if total_members == 2:
            # Simple swap for two members
            await _defer_two_members(db, current_picker_id, current_picker_name)
            action_description = f"swapped positions with the other member"
        
        elif total_members == 3:
            # With 3 members, deferring means going to the end
            await _defer_to_end(db, current_picker_id, current_picker_name, total_members)
            action_description = f"moved to the end of the queue"
        
        else:
            # With 4+ members, defer by moving one position back
            await _defer_one_position(db, current_picker_id, current_picker_name)
            action_description = f"moved one position back in the queue"
        
        # Get the new current picker
        cursor = await db.execute('SELECT name FROM members WHERE position = 1')
        new_picker = await cursor.fetchone()
        new_picker_name = new_picker[0] if new_picker else "Unknown"
        
        # Log the activity
        await log_activity("PICKER_DEFERRED", current_picker_name, 
                          f"Deferred turn, {new_picker_name} is now picking")
        
        # Create announcement embed
        embed = discord.Embed(
            title="⏭️ Turn Deferred",
            color=0xf39c12,
            timestamp=datetime.now(UTC)
        )
        
        embed.add_field(
            name="Deferred",
            value=f"**{current_picker_name}** has {action_description}.",
            inline=False
        )
        
        embed.add_field(
            name="Now Picking",
            value=f"🎉 **{new_picker_name}**, you're up next to pick a book!",
            inline=False
        )
        
        embed.add_field(
            name="📢 Note",
            value=f"**{current_picker_name}** will get their turn again soon!",
            inline=False
        )
        
        await ctx.send(embed=embed)
        
        # Display updated queue
        await display_queue(ctx)

# Helper functions for different defer scenarios

async def _defer_two_members(db, current_picker_id, current_picker_name):
    """Handle defer logic for exactly 2 members (simple swap)."""
    # Get the other member
    cursor = await db.execute('SELECT id FROM members WHERE position = 2')
    other_member = await cursor.fetchone()
    other_member_id = other_member[0]
    
    # Swap positions
    await db.execute('UPDATE members SET position = 2 WHERE id = ?', (current_picker_id,))
    await db.execute('UPDATE members SET position = 1 WHERE id = ?', (other_member_id,))
    
    # Update picker timestamps
    await db.execute('UPDATE members SET current_picker_since = NULL WHERE id = ?', (current_picker_id,))
    await db.execute('UPDATE members SET current_picker_since = ? WHERE id = ?', 
                    (datetime.now(UTC).isoformat(), other_member_id))
    
    await db.commit()


async def _defer_to_end(db, current_picker_id, current_picker_name, total_members):
    """Handle defer logic for exactly 3 members (move to end)."""
    # Move current picker to the end
    await db.execute('UPDATE members SET position = ? WHERE id = ?', (total_members, current_picker_id))
    
    # Move everyone else up one position
    await db.execute('UPDATE members SET position = position - 1 WHERE position > 1 AND id != ?', (current_picker_id,))
    
    # Update picker timestamps
    await db.execute('UPDATE members SET current_picker_since = NULL WHERE id = ?', (current_picker_id,))
    
    # Set new current picker timestamp
    cursor = await db.execute('SELECT id FROM members WHERE position = 1')
    new_picker = await cursor.fetchone()
    if new_picker:
        await db.execute('UPDATE members SET current_picker_since = ? WHERE id = ?', 
                        (datetime.now(UTC).isoformat(), new_picker[0]))
    
    await db.commit()


async def _defer_one_position(db, current_picker_id, current_picker_name):
    """Handle defer logic for 4+ members (move one position back)."""
    # Get the member at position 2 (who will become the new current picker)
    cursor = await db.execute('SELECT id FROM members WHERE position = 2')
    new_picker = await cursor.fetchone()
    new_picker_id = new_picker[0]
    
    # Get the member at position 3 (who will move to position 2)
    cursor = await db.execute('SELECT id FROM members WHERE position = 3')
    third_member = await cursor.fetchone()
    third_member_id = third_member[0] if third_member else None
    
    # Perform the position swaps
    # Current picker (pos 1) -> pos 3
    await db.execute('UPDATE members SET position = 3 WHERE id = ?', (current_picker_id,))
    
    # Member at pos 2 -> pos 1 (new current picker)
    await db.execute('UPDATE members SET position = 1 WHERE id = ?', (new_picker_id,))
    
    # Member at pos 3 -> pos 2 (if exists)
    if third_member_id:
        await db.execute('UPDATE members SET position = 2 WHERE id = ?', (third_member_id,))
    
    # Update picker timestamps
    await db.execute('UPDATE members SET current_picker_since = NULL WHERE id = ?', (current_picker_id,))
    await db.execute('UPDATE members SET current_picker_since = ? WHERE id = ?', 
                    (datetime.now(UTC).isoformat(), new_picker_id))
    
    await db.commit()

# --- Run the Bot ---

if __name__ == '__main__':
    # Get Discord token from environment
    DISCORD_TOKEN = os.getenv('DISCORD_TOKEN')
    
    if DISCORD_TOKEN is None:
        print("ERROR: DISCORD_TOKEN not found in .env file.")
        print("Please ensure your .env file contains: DISCORD_TOKEN=your_bot_token_here")
        exit(1)
    
    try:
        # Run the bot
        bot.run(DISCORD_TOKEN)
    except discord.LoginFailure:
        print("ERROR: Invalid Discord token. Please check your DISCORD_TOKEN in the .env file.")
    except Exception as e:
        print(f"ERROR: Failed to start bot: {e}")
