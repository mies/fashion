export const apiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Fashion Catalog API",
    description: "API for managing a seasonal fashion catalog",
    version: "1.0.0"
  },
  // servers: [
  //   {
  //     url: "http://localhost:8787",
  //     description: "Local server"
  //   }
  // ],
  paths: {
    "/api/fashion-items": {
      get: {
        summary: "List fashion items",
        description: "Retrieve a list of fashion items, optionally filtered by season and category",
        parameters: [
          {
            name: "season",
            in: "query",
            description: "Filter items by season",
            required: false,
            schema: {
              type: "string",
              enum: ["Spring", "Summer", "Fall", "Winter"]
            }
          },
          {
            name: "category",
            in: "query",
            description: "Filter items by category",
            required: false,
            schema: {
              type: "string"
            }
          }
        ],
        responses: {
          "200": {
            description: "List of fashion items",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/FashionItem"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: "Create a new fashion item",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/NewFashionItem"
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Fashion item created",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/FashionItem"
                }
              }
            }
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/api/fashion-items/{id}": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "integer"
          }
        }
      ],
      get: {
        summary: "Get a fashion item by ID",
        responses: {
          "200": {
            description: "Fashion item found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/FashionItem"
                }
              }
            }
          },
          "404": {
            description: "Fashion item not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          }
        }
      },
      put: {
        summary: "Update a fashion item",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/NewFashionItem"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Fashion item updated",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/FashionItem"
                }
              }
            }
          },
          "404": {
            description: "Fashion item not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          }
        }
      },
      delete: {
        summary: "Delete a fashion item",
        responses: {
          "200": {
            description: "Fashion item deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Item deleted successfully"
                    }
                  }
                }
              }
            }
          },
          "404": {
            description: "Fashion item not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/api/fashion-items/price-range": {
      get: {
        summary: "Get fashion items within a price range",
        parameters: [
          {
            name: "min",
            in: "query",
            description: "Minimum price in cents",
            required: false,
            schema: {
              type: "integer",
              minimum: 0,
              default: 0
            }
          },
          {
            name: "max",
            in: "query",
            description: "Maximum price in cents",
            required: false,
            schema: {
              type: "integer",
              minimum: 0
            }
          }
        ],
        responses: {
          "200": {
            description: "List of fashion items within price range",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/FashionItem"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/fashion-items/trending": {
      get: {
        summary: "Get trending fashion items",
        parameters: [
          {
            name: "limit",
            in: "query",
            description: "Maximum number of items to return",
            required: false,
            schema: {
              type: "integer",
              minimum: 1,
              default: 10
            }
          }
        ],
        responses: {
          "200": {
            description: "List of trending fashion items",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/FashionItem"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/fashion-items/by-categories": {
      get: {
        summary: "Get fashion items by multiple categories",
        parameters: [
          {
            name: "categories",
            in: "query",
            description: "Comma-separated list of categories",
            required: true,
            schema: {
              type: "string"
            },
            example: "Dresses,Tops,Accessories"
          }
        ],
        responses: {
          "200": {
            description: "List of fashion items in specified categories",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/FashionItem"
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "No categories provided",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/api/fashion-items/{id}/stock-status": {
      patch: {
        summary: "Update stock status of a fashion item",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer"
            }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["inStock"],
                properties: {
                  inStock: {
                    type: "boolean",
                    description: "New stock status"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Stock status updated",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/FashionItem"
                }
              }
            }
          },
          "400": {
            description: "Invalid request body",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            description: "Fashion item not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/api/fashion-items/bulk-price-update": {
      post: {
        summary: "Attempt to update prices for items in a category",
        description: "This endpoint demonstrates error handling and may fail with a 500 error",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["category", "percentageIncrease"],
                properties: {
                  category: {
                    type: "string",
                    description: "Category of items to update",
                    example: "Dresses"
                  },
                  percentageIncrease: {
                    type: "number",
                    description: "Percentage to increase prices by",
                    example: 10
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Prices updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/FashionItem"
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Invalid input parameters",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Failed to update prices"
                    },
                    details: {
                      type: "string",
                      example: "Error message from the database"
                    },
                    technicalDetails: {
                      type: "string",
                      example: "Attempted to perform an invalid SQL operation"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      NewFashionItem: {
        type: "object",
        required: ["name", "description", "season", "category", "price"],
        properties: {
          name: {
            type: "string",
            example: "Summer Floral Dress"
          },
          description: {
            type: "string",
            example: "Light and breezy floral dress perfect for summer days"
          },
          season: {
            type: "string",
            enum: ["Spring", "Summer", "Fall", "Winter"],
            example: "Summer"
          },
          category: {
            type: "string",
            example: "Dresses"
          },
          price: {
            type: "integer",
            example: 7999
          },
          imageUrl: {
            type: "string",
            example: "https://example.com/dress.jpg"
          },
          inStock: {
            type: "boolean",
            default: true
          }
        }
      },
      FashionItem: {
        allOf: [
          { $ref: "#/components/schemas/NewFashionItem" },
          {
            type: "object",
            required: ["id", "createdAt", "updatedAt"],
            properties: {
              id: {
                type: "integer",
                example: 1
              },
              createdAt: {
                type: "string",
                format: "date-time"
              },
              updatedAt: {
                type: "string",
                format: "date-time"
              }
            }
          }
        ]
      },
      Error: {
        type: "object",
        properties: {
          error: {
            type: "string",
            example: "Item not found"
          }
        }
      }
    }
  }
} as const;

export default apiSpec; 