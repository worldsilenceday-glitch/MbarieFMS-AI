import { VoiceInventoryCommand, AIInventoryResponse, InventoryItem } from '../../types/inventory';
import { localDB } from '../storage/localDB';

export class InventoryAI {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.deepseek.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async processVoiceCommand(command: string): Promise<AIInventoryResponse> {
    try {
      // First, parse the command to extract intent and parameters
      const parsedCommand = this.parseVoiceCommand(command);
      
      // Process based on intent
      switch (parsedCommand.intent) {
        case 'add':
          return await this.handleAddCommand(parsedCommand);
        case 'query':
          return await this.handleQueryCommand(parsedCommand);
        case 'update':
          return await this.handleUpdateCommand(parsedCommand);
        case 'list':
          return await this.handleListCommand(parsedCommand);
        case 'alert':
          return await this.handleAlertCommand(parsedCommand);
        default:
          return {
            success: false,
            message: "I didn't understand that command. Try saying 'add item', 'check stock', or 'list inventory'."
          };
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      return {
        success: false,
        message: 'Sorry, I encountered an error processing your command.'
      };
    }
  }

  private parseVoiceCommand(command: string): VoiceInventoryCommand {
    const lowerCommand = command.toLowerCase();
    
    // Intent detection
    if (lowerCommand.includes('add') || lowerCommand.includes('create') || lowerCommand.includes('new')) {
      return this.parseAddCommand(command);
    } else if (lowerCommand.includes('check') || lowerCommand.includes('how many') || lowerCommand.includes('quantity')) {
      return this.parseQueryCommand(command);
    } else if (lowerCommand.includes('update') || lowerCommand.includes('change') || lowerCommand.includes('modify')) {
      return this.parseUpdateCommand(command);
    } else if (lowerCommand.includes('list') || lowerCommand.includes('show') || lowerCommand.includes('display')) {
      return { intent: 'list' };
    } else if (lowerCommand.includes('alert') || lowerCommand.includes('low') || lowerCommand.includes('reorder')) {
      return { intent: 'alert' };
    } else {
      return { intent: 'query' }; // Default to query
    }
  }

  private parseAddCommand(command: string): VoiceInventoryCommand {
    const words = command.toLowerCase().split(' ');
    let quantity: number | undefined;
    let unit: string | undefined;
    let item: string | undefined;
    let category: string | undefined;

    // Extract quantity and unit
    for (let i = 0; i < words.length; i++) {
      const num = parseInt(words[i]);
      if (!isNaN(num)) {
        quantity = num;
        // Check if next word is a unit
        const potentialUnits = ['liters', 'litre', 'l', 'kilograms', 'kg', 'pieces', 'pcs', 'units', 'boxes', 'packs'];
        if (i + 1 < words.length && potentialUnits.includes(words[i + 1])) {
          unit = words[i + 1];
        }
        break;
      }
    }

    // Extract item name (everything after "add" or "create")
    const addIndex = Math.max(
      command.toLowerCase().indexOf('add'),
      command.toLowerCase().indexOf('create'),
      command.toLowerCase().indexOf('new')
    );
    
    if (addIndex !== -1) {
      const afterAdd = command.substring(addIndex + 3).trim();
      // Remove quantity and unit from item name
      let itemName = afterAdd;
      if (quantity) {
        itemName = itemName.replace(quantity.toString(), '').trim();
      }
      if (unit) {
        itemName = itemName.replace(unit, '').trim();
      }
      item = itemName;
    }

    // Determine category based on keywords
    const categoryKeywords: { [key: string]: string[] } = {
      'fuel': ['diesel', 'petrol', 'gasoline', 'fuel'],
      'lubricant': ['oil', 'lubricant', 'grease'],
      'electrical': ['bulb', 'wire', 'cable', 'electrical', 'led'],
      'mechanical': ['tool', 'part', 'mechanical'],
      'safety': ['glove', 'helmet', 'safety', 'protective']
    };

    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => command.toLowerCase().includes(keyword))) {
        category = cat;
        break;
      }
    }

    return {
      intent: 'add',
      item,
      quantity,
      unit,
      category
    };
  }

  private parseQueryCommand(command: string): VoiceInventoryCommand {
    const words = command.toLowerCase().split(' ');
    let item: string | undefined;

    // Extract item name after query words
    const queryWords = ['check', 'how many', 'quantity', 'stock', 'level'];
    for (const qWord of queryWords) {
      const index = command.toLowerCase().indexOf(qWord);
      if (index !== -1) {
        const afterQuery = command.substring(index + qWord.length).trim();
        // Remove common filler words
        const fillerWords = ['of', 'the', 'for', 'in'];
        item = afterQuery.split(' ')
          .filter(word => !fillerWords.includes(word.toLowerCase()))
          .join(' ');
        break;
      }
    }

    return {
      intent: 'query',
      item
    };
  }

  private parseUpdateCommand(command: string): VoiceInventoryCommand {
    // Simplified parsing for update commands
    return {
      intent: 'update',
      action: command
    };
  }

  private async handleAddCommand(command: VoiceInventoryCommand): Promise<AIInventoryResponse> {
    if (!command.item || !command.quantity) {
      return {
        success: false,
        message: "I need to know what item and how much to add. For example: 'Add 50 liters of diesel'"
      };
    }

    try {
      // Check if item already exists
      const existingItems = await localDB.getAllInventoryItems();
      const existingItem = existingItems.find(item => 
        item.name.toLowerCase().includes(command.item!.toLowerCase())
      );

      if (existingItem) {
        // Update existing item
        const newQuantity = existingItem.quantity + command.quantity;
        await localDB.updateInventoryItem(existingItem.id, {
          quantity: newQuantity,
          lastUpdated: new Date()
        });

        // Add transaction
        await localDB.addTransaction({
          itemId: existingItem.id,
          type: 'in',
          quantity: command.quantity,
          previousQuantity: existingItem.quantity,
          newQuantity: newQuantity,
          reason: 'Voice command addition',
          performedBy: 'Storekeeper',
          timestamp: new Date(),
          synced: false
        });

        return {
          success: true,
          message: `Added ${command.quantity} ${command.unit || 'units'} of ${command.item}. New quantity: ${newQuantity}.`,
          data: { itemId: existingItem.id, newQuantity }
        };
      } else {
        // Create new item
        const defaultReorderLevel = command.quantity * 0.2; // 20% of initial quantity
        const itemId = await localDB.addInventoryItem({
          name: command.item,
          category: command.category || 'general',
          quantity: command.quantity,
          unit: command.unit || 'units',
          reorderLevel: Math.max(1, Math.floor(defaultReorderLevel)),
          supplier: 'Unknown',
          lastUpdated: new Date(),
          isActive: true
        });

        // Add transaction
        await localDB.addTransaction({
          itemId,
          type: 'in',
          quantity: command.quantity,
          previousQuantity: 0,
          newQuantity: command.quantity,
          reason: 'Voice command - new item',
          performedBy: 'Storekeeper',
          timestamp: new Date(),
          synced: false
        });

        return {
          success: true,
          message: `Created new item: ${command.item} with ${command.quantity} ${command.unit || 'units'}.`,
          data: { itemId }
        };
      }
    } catch (error) {
      console.error('Error adding inventory item:', error);
      return {
        success: false,
        message: 'Failed to add the item to inventory.'
      };
    }
  }

  private async handleQueryCommand(command: VoiceInventoryCommand): Promise<AIInventoryResponse> {
    if (!command.item) {
      return {
        success: false,
        message: "What item would you like to check? For example: 'Check diesel stock'"
      };
    }

    try {
      const items = await localDB.getAllInventoryItems();
      const matchingItems = items.filter(item => 
        item.name.toLowerCase().includes(command.item!.toLowerCase())
      );

      if (matchingItems.length === 0) {
        return {
          success: false,
          message: `I couldn't find any items matching "${command.item}".`
        };
      }

      if (matchingItems.length === 1) {
        const item = matchingItems[0];
        let message = `${item.name}: ${item.quantity} ${item.unit}`;
        
        if (item.quantity <= item.reorderLevel) {
          message += ` (LOW STOCK - reorder level is ${item.reorderLevel})`;
        }

        return {
          success: true,
          message,
          data: item
        };
      } else {
        const itemList = matchingItems.map(item => 
          `${item.name}: ${item.quantity} ${item.unit}`
        ).join(', ');
        
        return {
          success: true,
          message: `Found multiple items: ${itemList}`,
          data: matchingItems
        };
      }
    } catch (error) {
      console.error('Error querying inventory:', error);
      return {
        success: false,
        message: 'Failed to query inventory.'
      };
    }
  }

  private async handleUpdateCommand(command: VoiceInventoryCommand): Promise<AIInventoryResponse> {
    // This would be more complex in a real implementation
    return {
      success: false,
      message: "Update commands are not fully implemented yet. Please use the web interface for updates."
    };
  }

  private async handleListCommand(command: VoiceInventoryCommand): Promise<AIInventoryResponse> {
    try {
      const items = await localDB.getAllInventoryItems();
      const activeItems = items.filter(item => item.isActive);

      if (activeItems.length === 0) {
        return {
          success: true,
          message: "No inventory items found."
        };
      }

      const totalItems = activeItems.length;
      const lowStockItems = activeItems.filter(item => item.quantity <= item.reorderLevel);

      let message = `You have ${totalItems} items in inventory.`;
      
      if (lowStockItems.length > 0) {
        message += ` ${lowStockItems.length} items need reordering.`;
      }

      return {
        success: true,
        message,
        data: {
          totalItems,
          lowStockCount: lowStockItems.length,
          items: activeItems.slice(0, 5) // Return first 5 items
        }
      };
    } catch (error) {
      console.error('Error listing inventory:', error);
      return {
        success: false,
        message: 'Failed to list inventory items.'
      };
    }
  }

  private async handleAlertCommand(command: VoiceInventoryCommand): Promise<AIInventoryResponse> {
    try {
      const alerts = await localDB.getActiveAlerts();
      
      if (alerts.length === 0) {
        return {
          success: true,
          message: "No active stock alerts."
        };
      }

      const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
      const lowAlerts = alerts.filter(alert => alert.severity === 'low');

      let message = '';
      if (criticalAlerts.length > 0) {
        message += `CRITICAL: ${criticalAlerts.length} items are out of stock or very low. `;
      }
      if (lowAlerts.length > 0) {
        message += `LOW: ${lowAlerts.length} items are below reorder level.`;
      }

      return {
        success: true,
        message: message || "No urgent stock alerts.",
        data: alerts
      };
    } catch (error) {
      console.error('Error checking alerts:', error);
      return {
        success: false,
        message: 'Failed to check stock alerts.'
      };
    }
  }

  // Method to generate AI insights about inventory
  async generateInventoryInsights(): Promise<string> {
    try {
      const items = await localDB.getAllInventoryItems();
      const activeItems = items.filter(item => item.isActive);
      const lowStockItems = activeItems.filter(item => item.quantity <= item.reorderLevel);

      if (activeItems.length === 0) {
        return "No inventory data available for analysis.";
      }

      let insights = `Inventory Analysis:\n`;
      insights += `• Total items: ${activeItems.length}\n`;
      insights += `• Low stock items: ${lowStockItems.length}\n`;
      
      if (lowStockItems.length > 0) {
        insights += `• Items needing reorder: ${lowStockItems.map(item => item.name).join(', ')}\n`;
      }

      // Calculate total value (simplified)
      const totalValue = activeItems.reduce((sum, item) => {
        return sum + (item.quantity * (item.costPerUnit || 1));
      }, 0);

      insights += `• Estimated inventory value: $${totalValue.toFixed(2)}\n`;

      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return "Unable to generate inventory insights at this time.";
    }
  }
}

export const inventoryAI = new InventoryAI(
  import.meta.env.VITE_AI_API_KEY || 'sk-17aab34fe0034f0c9ea6d32245d56a13'
);
