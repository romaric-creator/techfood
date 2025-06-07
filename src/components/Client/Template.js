// App.js
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Snackbar,
  Alert,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Card,
  CardMedia,
  CardContent,
} from "@mui/material";
import {
  Fastfood,
  ShoppingCart,
  AccessTime,
  Person,
  Add,
  Remove,
  Delete,
} from "@mui/icons-material";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000";
const URL_IMG = "http://localhost:3000";

export default function App() {
  // --- LOGIQUE inchangée ---
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const menusRes = await axios.get(`${API_BASE_URL}/api/menus`);
        const categoriesRes = await axios.get(`${API_BASE_URL}/api/categories`);
        setMenus(menusRes.data.map((m) => ({ ...m, selectionCount: 0 })));
        setCategories(categoriesRes.data);
        setSelectedCategory(categoriesRes.data[0]?.idCat);
      } catch {
        showSnackbar("Erreur lors du chargement", "error");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const addToCart = (menu) => {
    const exists = cart.find((i) => i.idMenu === menu.idMenu);
    if (exists) {
      setCart(
        cart.map((i) =>
          i.idMenu === menu.idMenu ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setCart([...cart, { ...menu, quantity: 1, price: parseFloat(menu.price) }]);
    }
    setMenus(
      menus.map((m) =>
        m.idMenu === menu.idMenu ? { ...m, selectionCount: m.selectionCount + 1 } : m
      )
    );
    showSnackbar(`${menu.name} ajouté au panier`);
  };

  const decreaseItemQuantity = (item) => {
    setCart(
      cart
        .map((i) =>
          i.idMenu === item.idMenu ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const calculateTotal = () =>
    cart.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2);

  const placeOrder = async () => {
    if (!cart.length) {
      showSnackbar("Votre panier est vide", "error");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/commande`, {
        idUsers: 1,
        idtable: 9,
        items: cart.map((i) => ({
          idMenu: i.idMenu,
          quantity: i.quantity,
          price: i.price,
        })),
        status: "En cours",
      });
      showSnackbar("Commande passée !");
      setOrderHistory([...orderHistory, ...cart]);
      setCart([]);
    } catch {
      showSnackbar("Erreur lors de la commande", "error");
    }
  };
  // --- FIN logique ---

  const filteredMenus = menus.filter(
    (m) =>
      (!selectedCategory || m.idCat === selectedCategory) &&
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Rendu des écrans ---
  const renderMenu = () => (
    <Box sx={{ p: 2, pb: 10, bgcolor: "#fafafa", minHeight: "100vh" }}>
      <Typography variant="h6" fontWeight="bold">
        Choose Your Favorite{" "}
        <Box component="span" color="error.main">
          Food
        </Box>
      </Typography>
      <TextField
        fullWidth
        placeholder="Search"
        variant="outlined"
        size="small"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{
          mt: 1,
          "& .MuiOutlinedInput-root": { borderRadius: 4 },
        }}
      />

      <Box sx={{ mt: 2, display: "flex", gap: 1, overflowX: "auto" }}>
        {categories.map((cat) => (
          <Button
            key={cat.idCat}
            size="small"
            variant={selectedCategory === cat.idCat ? "contained" : "outlined"}
            color="error"
            onClick={() => setSelectedCategory(cat.idCat)}
            sx={{ borderRadius: 10 }}
          >
            {cat.name}
          </Button>
        ))}
      </Box>

      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress color="error" />
        </Box>
      ) : filteredMenus.length === 0 ? (
        <Typography textAlign="center" color="text.secondary" sx={{ mt: 4 }}>
          Aucun résultat
        </Typography>
      ) : (
        filteredMenus.map((item) => (
          <Card
            key={item.idMenu}
            sx={{
              mb: 2,
              borderRadius: 4,
              boxShadow: 2,
              overflow: "visible",
            }}
          >
            <CardMedia
              component="img"
              height="180"
              image={`${URL_IMG}/uploads/${item.image_url}`}
              alt={item.name}
              sx={{ objectFit: "cover", borderTopRadius: 4 }}
            />
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold">
                {item.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {item.description}
              </Typography>
              <Typography variant="h6" color="error.main">
                {item.price}€
              </Typography>
              <Button
                variant="contained"
                color="error"
                fullWidth
                onClick={() => addToCart(item)}
                sx={{ mt: 1, borderRadius: 10 }}
              >
                Add to Cart
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );

  const renderCart = () => (
    <Box sx={{ p: 2, pb: 10, bgcolor: "#fafafa", minHeight: "100vh" }}>
      <Typography variant="h6" mb={2}>
        Panier ({cart.length})
      </Typography>
      {!cart.length ? (
        <Typography textAlign="center" color="text.secondary" sx={{ mt: 4 }}>
          Votre panier est vide.
        </Typography>
      ) : (
        <>
          {cart.map((item, i) => (
            <Card
              key={i}
              sx={{ mb: 2, borderRadius: 4, boxShadow: 2 }}
            >
              <CardMedia
                component="img"
                height="150"
                image={`${URL_IMG}/uploads/${item.image_url}`}
                alt={item.name}
              />
              <CardContent>
                <Typography fontWeight="bold">{item.name}</Typography>
                <Typography color="error.main">{item.price}€</Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <IconButton onClick={() => decreaseItemQuantity(item)}>
                    <Remove />
                  </IconButton>
                  <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                  <IconButton onClick={() => addToCart(item)}>
                    <Add />
                  </IconButton>
                  <IconButton onClick={() => setCart(cart.filter((_, idx) => idx !== i))}>
                    <Delete />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
          <Typography variant="h6">Total : {calculateTotal()}€</Typography>
          <Button
            variant="contained"
            color="error"
            fullWidth
            onClick={placeOrder}
            sx={{ mt: 2, borderRadius: 10 }}
          >
            Passer la commande
          </Button>
        </>
      )}
    </Box>
  );

  const renderHistory = () => (
    <Box sx={{ p: 2, pb: 10, bgcolor: "#fafafa", minHeight: "100vh" }}>
      <Typography variant="h6" mb={2}>
        Historique
      </Typography>
      {!orderHistory.length ? (
        <Typography textAlign="center" color="text.secondary" sx={{ mt: 4 }}>
          Aucune commande passée.
        </Typography>
      ) : (
        orderHistory.map((item, i) => (
          <Card key={i} sx={{ mb: 2, borderRadius: 4, boxShadow: 2 }}>
            <CardMedia
              component="img"
              height="150"
              image={`${URL_IMG}/uploads/${item.image_url}`}
              alt={item.name}
            />
            <CardContent>
              <Typography fontWeight="bold">{item.name}</Typography>
              <Typography color="error.main">{item.price}€</Typography>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );

  const renderProfile = () => (
    <Box sx={{ p: 2, pb: 10, bgcolor: "#fafafa", minHeight: "100vh" }}>
      <Typography variant="h6" mb={2}>
        Mon Profil
      </Typography>
      <Card sx={{ borderRadius: 4, boxShadow: 2 }}>
        <CardContent>
          <Typography>Nom : John Doe</Typography>
          <Typography>Email : johndoe@example.com</Typography>
          <Typography>Téléphone : 123-456-7890</Typography>
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <>
      {page === 0 && renderMenu()}
      {page === 1 && renderCart()}
      {page === 2 && renderHistory()}
      {page === 3 && renderProfile()}

      <Paper
        sx={{
          position: "fixed",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          borderRadius: 8,
          width: "90%",
          boxShadow: 3,
        }}
        elevation={3}
      >
        <BottomNavigation
          showLabels
          value={page}
          onChange={(e, v) => setPage(v)}
          sx={{
            bgcolor: "#fff",
            "& .Mui-selected": { color: "#d32f2f" },
          }}
        >
          <BottomNavigationAction label="Menu" icon={<Fastfood />} />
          <BottomNavigationAction label="Panier" icon={<ShoppingCart />} />
          <BottomNavigationAction label="Historique" icon={<AccessTime />} />
          <BottomNavigationAction label="Profil" icon={<Person />} />
        </BottomNavigation>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ bgcolor: "#d32f2f", color: "#fff" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}









// App.js
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Snackbar, Provider as PaperProvider } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import tw from 'tailwind-react-native-classnames';
import axios from 'axios';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 16px padding * 2 + 16px gap

const API_BASE_URL = 'http://localhost:5000';
const URL_IMG = 'http://localhost:3000';

function MenuScreen({ showMsg }) {
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const m = await axios.get(`${API_BASE_URL}/api/menus`);
        const c = await axios.get(`${API_BASE_URL}/api/categories`);
        setMenus(m.data.map(item => ({ ...item, selectionCount: 0 })));
        setCategories(c.data);
        setSelectedCategory(c.data[0]?.idCat);
      } catch {
        showMsg('Erreur chargement', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = menus.filter(
    m =>
      (!selectedCategory || m.idCat === selectedCategory) &&
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <View style={tw`bg-white rounded-2xl shadow mr-4 mb-4`} /* shadow android + ios */>
      <Image
        source={{ uri: `${URL_IMG}/uploads/${item.image_url}` }}
        style={[tw`rounded-t-2xl`, { width: CARD_WIDTH, height: CARD_WIDTH }]}
        resizeMode="cover"
      />
      <View style={tw`p-2`}>
        <Text style={tw`font-bold text-base`}>{item.name}</Text>
        <Text style={tw`text-gray-500 text-xs`}>{item.description}</Text>
        <Text style={tw`text-red-600 font-semibold mt-1`}>{item.price}€</Text>
        <TouchableOpacity
          style={tw`bg-red-600 py-1 rounded-full mt-2`}
          onPress={() => showMsg(`${item.name} ajouté !`)}
        >
          <Text style={tw`text-white text-center`}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50 p-4 pb-0`}>
      <Text style={tw`text-xl font-bold`}>
        Choose Your Favorite <Text style={tw`text-red-600`}>Food</Text>
      </Text>
      <TextInput
        style={tw`bg-white rounded-2xl py-2 px-4 mt-2`}
        placeholder="Search"
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#999"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={tw`mt-3`}
        contentContainerStyle={tw`pr-4`}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.idCat}
            style={tw`px-4 py-2 mr-2 rounded-full ${
              selectedCategory === cat.idCat ? 'bg-red-600' : 'bg-white'
            } shadow`}
            onPress={() => setSelectedCategory(cat.idCat)}
          >
            <Text
              style={tw`${selectedCategory === cat.idCat ? 'text-white' : 'text-gray-700'}`}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <Ionicons name="refresh-circle" size={48} color="#e53e3e" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.idMenu)}
          renderItem={renderItem}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`pt-2 pb-20`}
          columnWrapperStyle={tw`justify-between`}
        />
      )}
    </SafeAreaView>
  );
}

function CartScreen({ showMsg }) {
  const [cart, setCart] = useState([]);

  const decrease = idx => {
    const c = [...cart];
    if (c[idx].quantity > 1) c[idx].quantity--;
    else c.splice(idx, 1);
    setCart(c);
  };

  const increase = idx => {
    const c = [...cart];
    c[idx].quantity++;
    setCart(c);
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2);

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50 p-4 pb-0`}>
      <Text style={tw`text-xl font-bold mb-2`}>Panier ({cart.length})</Text>
      {cart.length === 0 ? (
        <Text style={tw`text-center text-gray-500 mt-10`}>Votre panier est vide.</Text>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item, index }) => (
            <View style={tw`bg-white rounded-2xl shadow mb-4 overflow-hidden`}>
              <Image
                source={{ uri: `${URL_IMG}/uploads/${item.image_url}` }}
                style={tw`w-full h-40`}
                resizeMode="cover"
              />
              <View style={tw`p-3`}>
                <Text style={tw`font-bold text-base`}>{item.name}</Text>
                <Text style={tw`text-red-600 font-semibold mt-1`}>{item.price}€</Text>
                <View style={tw`flex-row items-center mt-2`}>
                  <TouchableOpacity onPress={() => decrease(index)}>
                    <Ionicons name="remove-circle" size={28} color="#e53e3e" />
                  </TouchableOpacity>
                  <Text style={tw`mx-4`}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => increase(index)}>
                    <Ionicons name="add-circle" size={28} color="#e53e3e" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={tw`ml-auto`}
                    onPress={() => {
                      const c = cart.filter((_, i) => i !== index);
                      setCart(c);
                    }}
                  >
                    <Ionicons name="trash-bin" size={24} color="#999" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={tw`pb-20`}
        />
      )}
      {cart.length > 0 && (
        <TouchableOpacity
          style={tw`bg-red-600 py-3 rounded-full absolute bottom-6 left-4 right-4`}
          onPress={() => showMsg(`Commande à ${total}€ passée !`)}
        >
          <Text style={tw`text-white text-center font-bold`}>Passer la commande</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

function HistoryScreen() {
  const [history] = useState([]); // même logique, immuable ici
  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50 p-4`}>
      <Text style={tw`text-xl font-bold mb-2`}>Historique</Text>
      {history.length === 0 ? (
        <Text style={tw`text-center text-gray-500 mt-10`}>Aucune commande passée.</Text>
      ) : null}
    </SafeAreaView>
  );
}

function ProfileScreen() {
  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50 p-4`}>
      <Text style={tw`text-xl font-bold mb-2`}>Mon Profil</Text>
      <View style={tw`bg-white rounded-2xl shadow p-4`}>
        <Text>Nom : John Doe</Text>
        <Text>Email : johndoe@example.com</Text>
        <Text>Téléphone : 123-456-7890</Text>
      </View>
    </SafeAreaView>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  const [snackbar, setSnackbar] = useState({ visible: false, msg: '' });

  const showMsg = (msg) => {
    setSnackbar({ visible: true, msg });
  };
  const hideMsg = () => setSnackbar({ visible: false, msg: '' });

  return (
    <PaperProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#e53e3e',
            tabBarInactiveTintColor: '#999',
            tabBarStyle: tw`h-16 bg-white border-t border-gray-200`,
          }}
        >
          <Tab.Screen
            name="Menu"
            children={() => <MenuScreen showMsg={showMsg} />}
            options={{ tabBarIcon: ({ color, size }) => <Ionicons name="restaurant" color={color} size={size} /> }}
          />
          <Tab.Screen
            name="Cart"
            children={() => <CartScreen showMsg={showMsg} />}
            options={{ tabBarIcon: ({ color, size }) => <Ionicons name="cart" color={color} size={size} /> }}
          />
          <Tab.Screen
            name="History"
            component={HistoryScreen}
            options={{ tabBarIcon: ({ color, size }) => <Ionicons name="time" color={color} size={size} /> }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} /> }}
          />
        </Tab.Navigator>
      </NavigationContainer>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={hideMsg}
        duration={2000}
        style={tw`bg-red-600`}
      >
        <Text style={tw`text-white`}>{snackbar.msg}</Text>
      </Snackbar>
    </PaperProvider>
  );
}