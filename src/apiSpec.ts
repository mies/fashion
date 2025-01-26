export const apiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Fashion Catalog API",
    description: "API for managing a seasonal fashion catalog",
    version: "1.0.0"
  },
  servers: [
    {
      url: "http://localhost:8787",
      description: "Local server"
    }
  ],
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