--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: field_locations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.field_locations (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.field_locations OWNER TO neondb_owner;

--
-- Name: field_locations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.field_locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.field_locations_id_seq OWNER TO neondb_owner;

--
-- Name: field_locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.field_locations_id_seq OWNED BY public.field_locations.id;


--
-- Name: inventory_history; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.inventory_history (
    id integer NOT NULL,
    product_id integer NOT NULL,
    previous_stock integer NOT NULL,
    change integer NOT NULL,
    new_stock integer NOT NULL,
    updated_by text NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    field_location text
);


ALTER TABLE public.inventory_history OWNER TO neondb_owner;

--
-- Name: inventory_history_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.inventory_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_history_id_seq OWNER TO neondb_owner;

--
-- Name: inventory_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.inventory_history_id_seq OWNED BY public.inventory_history.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name text NOT NULL,
    field_location text NOT NULL,
    current_stock integer DEFAULT 0 NOT NULL,
    unit text NOT NULL,
    retail_notes text,
    image_url text,
    date_added timestamp without time zone DEFAULT now() NOT NULL,
    crop_needs text,
    stand_inventory text,
    wash_inventory text,
    harvest_bins text,
    units_harvested text,
    field_notes text,
    show_in_wholesale boolean DEFAULT false NOT NULL,
    show_in_kitchen boolean DEFAULT false NOT NULL,
    show_in_retail boolean DEFAULT true NOT NULL
);


ALTER TABLE public.products OWNER TO neondb_owner;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO neondb_owner;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.settings (
    id integer NOT NULL,
    key character varying(100) NOT NULL,
    value jsonb NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.settings OWNER TO neondb_owner;

--
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_id_seq OWNER TO neondb_owner;

--
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- Name: site_auth; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.site_auth (
    id integer NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.site_auth OWNER TO neondb_owner;

--
-- Name: site_auth_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.site_auth_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.site_auth_id_seq OWNER TO neondb_owner;

--
-- Name: site_auth_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.site_auth_id_seq OWNED BY public.site_auth.id;


--
-- Name: field_locations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.field_locations ALTER COLUMN id SET DEFAULT nextval('public.field_locations_id_seq'::regclass);


--
-- Name: inventory_history id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory_history ALTER COLUMN id SET DEFAULT nextval('public.inventory_history_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- Name: site_auth id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.site_auth ALTER COLUMN id SET DEFAULT nextval('public.site_auth_id_seq'::regclass);


--
-- Data for Name: field_locations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.field_locations (id, name) FROM stdin;
41	Corn Ridge
48	Dane
3	East Greenhouse
49	Hoisington
5	Hoop House
47	Kitchen
39	Lower Blais
1	North Field
40	Rock Pile
45	Rt. 25
43	Side Hill 1
44	Side Hill 2
38	Side Hill 3
2	South Field
42	Stone Wall
37	Upper Blais
36	Veg. Ridge
4	West Greenhouse
\.


--
-- Data for Name: inventory_history; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.inventory_history (id, product_id, previous_stock, change, new_stock, updated_by, "timestamp", field_location) FROM stdin;
1	1	0	11	11	Farm Admin	2025-04-03 18:52:28.268582	\N
2	81	0	0	0	Farm Admin	2025-04-03 19:49:03.462757	\N
3	82	0	0	0	Farm Admin	2025-04-03 19:49:03.621992	\N
4	83	0	0	0	Farm Admin	2025-04-03 19:49:03.768667	\N
5	84	0	0	0	Farm Admin	2025-04-03 19:49:03.916385	\N
6	61	1	1	2	Farm Admin	2025-04-03 20:03:44.321177	Wholesale
7	61	2	1	3	Farm Admin	2025-04-03 20:03:44.424189	Wholesale
8	61	3	1	4	Farm Admin	2025-04-03 20:03:44.567078	Wholesale
9	61	1	-3	0	Farm Admin	2025-04-03 20:03:44.967952	Wholesale
10	87	0	1	1	Farm Admin	2025-04-03 20:10:48.354511	\N
11	88	0	1	1	Farm Admin	2025-04-03 20:13:21.99139	\N
12	88	2	1	3	Farm Admin	2025-04-03 20:13:22.641772	Wholesale
13	88	2	-1	1	Farm Admin	2025-04-03 20:13:23.003677	Wholesale
14	88	2	1	3	Farm Admin	2025-04-03 20:13:24.447883	Wholesale
15	89	0	1	1	Farm Admin	2025-04-03 20:13:26.061355	\N
16	89	2	1	3	Farm Admin	2025-04-03 20:13:27.722035	Kitchen
17	90	0	1	1	Farm Admin	2025-04-03 20:14:18.167757	\N
18	90	2	1	3	Farm Admin	2025-04-03 20:14:18.788629	Kitchen
19	90	4	1	5	Farm Admin	2025-04-03 20:14:19.457924	Kitchen
20	91	0	1	1	Farm Admin	2025-04-03 20:20:53.191796	\N
21	91	2	1	3	Farm Admin	2025-04-03 20:20:54.740703	Kitchen
22	1	0	-11	0	Farm Admin	2025-04-03 20:21:26.812952	Hoop House
23	92	0	0	0	Farm Admin	2025-04-03 20:39:42.251556	\N
24	93	0	0	0	Farm Admin	2025-04-03 20:39:43.300262	\N
25	94	0	0	0	Farm Admin	2025-04-03 20:39:43.905221	\N
26	95	0	0	0	Farm Admin	2025-04-03 20:39:45.816108	\N
27	96	0	0	0	Farm Admin	2025-04-03 20:39:59.817196	\N
28	97	0	0	0	Farm Admin	2025-04-03 20:40:00.533439	\N
29	98	0	0	0	Farm Admin	2025-04-03 20:40:02.534722	\N
30	99	0	0	0	Farm Admin	2025-04-03 20:40:02.765634	\N
31	100	0	0	0	Farm Admin	2025-04-03 20:40:02.962436	\N
32	101	0	0	0	Farm Admin	2025-04-03 20:40:03.1115	\N
33	102	0	0	0	Farm Admin	2025-04-03 20:40:03.57024	\N
34	103	0	0	0	Farm Admin	2025-04-03 20:40:03.75319	\N
35	104	0	0	0	Farm Admin	2025-04-03 20:40:03.924567	\N
36	105	0	0	0	Farm Admin	2025-04-03 20:40:04.45309	\N
37	106	0	0	0	Farm Admin	2025-04-03 20:40:04.983756	\N
38	107	0	0	0	Farm Admin	2025-04-03 20:40:07.527788	\N
39	108	0	0	0	Farm Admin	2025-04-03 20:40:16.171225	\N
40	109	0	0	0	Farm Admin	2025-04-03 20:40:16.520942	\N
41	110	0	0	0	Farm Admin	2025-04-03 20:42:54.135718	\N
42	111	0	0	0	Farm Admin	2025-04-03 20:42:55.350729	\N
43	112	0	0	0	Farm Admin	2025-04-03 20:42:56.305253	\N
44	113	0	0	0	Farm Admin	2025-04-03 20:42:56.81087	\N
45	114	0	0	0	Farm Admin	2025-04-03 20:42:57.141932	\N
46	115	0	0	0	Farm Admin	2025-04-03 20:42:57.283585	\N
47	116	0	0	0	Farm Admin	2025-04-03 20:42:57.559652	\N
48	117	0	0	0	Farm Admin	2025-04-03 20:42:59.300337	\N
49	118	0	0	0	Farm Admin	2025-04-03 20:42:59.370225	\N
50	119	0	0	0	Farm Admin	2025-04-03 20:43:00.906613	\N
51	120	0	0	0	Farm Admin	2025-04-03 20:43:01.137053	\N
52	121	0	0	0	Farm Admin	2025-04-03 20:46:07.65507	\N
53	122	0	0	0	Farm Admin	2025-04-03 20:46:07.782837	\N
54	123	0	0	0	Farm Admin	2025-04-03 20:46:09.066435	\N
55	124	0	0	0	Farm Admin	2025-04-03 20:46:09.23775	\N
56	125	0	0	0	Farm Admin	2025-04-03 20:46:09.381829	\N
57	126	0	0	0	Farm Admin	2025-04-03 20:46:09.537519	\N
58	127	0	0	0	Farm Admin	2025-04-03 21:03:22.696109	\N
59	128	0	0	0	Farm Admin	2025-04-03 21:03:22.834634	\N
60	129	0	0	0	Farm Admin	2025-04-03 21:03:23.087198	\N
61	130	0	0	0	Farm Admin	2025-04-03 21:05:30.118093	\N
62	131	0	0	0	Farm Admin	2025-04-03 21:05:30.522432	\N
63	132	0	0	0	Farm Admin	2025-04-03 21:05:31.191493	\N
64	133	0	0	0	Farm Admin	2025-04-03 21:05:34.202271	\N
65	134	0	0	0	Farm Admin	2025-04-03 21:05:34.768852	\N
66	135	0	0	0	Farm Admin	2025-04-03 21:05:35.199436	\N
67	136	0	0	0	Farm Admin	2025-04-03 21:05:35.895562	\N
68	137	0	0	0	Farm Admin	2025-04-03 21:05:36.124111	\N
69	138	0	0	0	Farm Admin	2025-04-03 21:05:43.335367	\N
70	139	0	0	0	Farm Admin	2025-04-03 21:05:43.562017	\N
71	140	0	0	0	Farm Admin	2025-04-03 21:05:49.32928	\N
72	141	0	0	0	Farm Admin	2025-04-03 21:05:49.719889	\N
73	142	0	0	0	Farm Admin	2025-04-03 21:07:51.778663	\N
74	143	0	0	0	Farm Admin	2025-04-03 21:07:55.154793	\N
75	144	0	0	0	Farm Admin	2025-04-03 21:07:55.327891	\N
76	145	0	0	0	Farm Admin	2025-04-03 21:07:55.500103	\N
77	146	0	0	0	Farm Admin	2025-04-03 21:07:55.853449	\N
78	4	0	1	1	Kitchen Update	2025-04-03 22:04:26.09806	Kitchen
79	4	1	1	2	Kitchen Update	2025-04-03 22:04:26.374526	Kitchen
80	4	2	1	3	Wholesale Update	2025-04-03 22:04:27.407826	Wholesale
81	4	13	1	14	Farm Admin	2025-04-03 22:17:33.486312	Dane
82	4	1	-1	0	Farm Admin	2025-04-03 22:17:43.876849	Dane
83	4	14	1	15	Farm Admin	2025-04-03 22:20:50.950992	Wash Inventory - Dane
84	4	3	1	4	Kitchen Update	2025-04-03 22:22:44.874086	Kitchen
85	4	15	1	16	Farm Admin	2025-04-03 22:23:01.991728	Wash Inventory - Dane
86	4	16	1	17	Farm Admin	2025-04-03 22:25:57.346207	Wash Inventory - Dane
87	4	17	1	18	Farm Admin	2025-04-03 22:25:58.329908	Wash Inventory - Dane
88	4	18	7	25	Farm Admin	2025-04-03 22:26:10.586522	Wash Inventory - Dane
89	4	25	1	26	Farm Admin	2025-04-03 22:29:14.970099	Wash Inventory - Dane
90	4	26	1	27	Farm Admin	2025-04-03 22:29:16.311378	Wash Inventory - Dane
91	4	27	-1	26	Farm Admin	2025-04-03 22:29:29.68446	Wash Inventory - Dane
92	4	26	-1	25	Farm Admin	2025-04-03 22:29:42.98506	Wash Inventory - Dane
93	4	25	-1	24	Farm Admin	2025-04-03 22:29:43.75334	Wash Inventory - Dane
94	4	24	-1	23	Farm Admin	2025-04-03 22:29:44.214862	Wash Inventory - Dane
95	4	23	1	24	Farm Admin	2025-04-03 22:31:29.154163	Wash Inventory - Dane
96	4	24	1	25	Farm Admin	2025-04-03 22:31:44.560048	Wash Inventory - Dane
97	4	25	1	26	Farm Admin	2025-04-03 22:32:07.854453	Wash Inventory - Dane
98	4	26	1	27	Farm Admin	2025-04-03 22:32:09.527476	Wash Inventory - Dane
99	4	27	1	28	Farm Admin	2025-04-03 22:32:10.170396	Wash Inventory - Dane
100	4	28	1	29	Farm Admin	2025-04-03 22:32:10.625814	Wash Inventory - Dane
101	4	29	1	30	Farm Admin	2025-04-03 22:34:03.289034	Wash Inventory - Dane
102	4	30	-1	29	Farm Admin	2025-04-03 22:34:11.200383	Wash Inventory - Dane
103	4	29	-1	28	Farm Admin	2025-04-03 22:34:11.648628	Wash Inventory - Dane
104	4	28	1	29	Farm Admin	2025-04-03 22:34:18.931029	Wash Inventory - Dane
105	4	29	1	30	Farm Admin	2025-04-03 22:34:27.308455	Wash Inventory - Dane
106	4	30	1	31	Farm Admin	2025-04-03 22:34:27.891658	Wash Inventory - Dane
107	4	31	1	32	Farm Admin	2025-04-03 22:34:28.291172	Wash Inventory - Dane
108	4	32	1	33	Farm Admin	2025-04-03 22:35:58.34347	Wash Inventory - Dane
109	4	33	-1	32	Farm Admin	2025-04-03 22:36:05.817969	Wash Inventory - Dane
110	4	32	-1	31	Farm Admin	2025-04-03 22:36:07.272992	Wash Inventory - Dane
111	4	31	1	32	Farm Admin	2025-04-03 22:36:18.718935	Wash Inventory - Dane
112	4	32	1	33	Farm Admin	2025-04-03 22:36:19.174871	Wash Inventory - Dane
113	4	33	1	34	Farm Admin	2025-04-03 22:36:20.193118	Wash Inventory - Dane
114	4	34	1	35	Farm Admin	2025-04-03 22:36:33.418308	Wash Inventory - Dane
115	4	35	1	36	Farm Admin	2025-04-03 22:36:34.190281	Wash Inventory - Dane
116	4	36	1	37	Farm Admin	2025-04-03 22:36:34.649338	Wash Inventory - Dane
117	4	37	1	38	Farm Admin	2025-04-03 22:36:35.10171	Wash Inventory - Dane
118	4	38	7	45	Farm Admin	2025-04-03 22:36:41.04831	Wash Inventory - Dane
119	4	4	1	5	Kitchen Update	2025-04-03 22:37:31.356735	Kitchen
120	4	45	-1	44	Farm Admin	2025-04-03 22:39:40.057824	Wash Inventory - Dane
121	4	44	-4	40	Farm Admin	2025-04-03 22:39:43.11096	Wash Inventory - Dane
122	4	40	1	41	Farm Admin	2025-04-03 22:42:40.530511	Wash Inventory - North Field
123	4	41	1	42	Farm Admin	2025-04-03 22:42:43.436032	Wash Inventory - North Field
124	4	42	8	50	Farm Admin	2025-04-03 22:42:52.851276	Wash Inventory - North Field
125	4	50	1	51	Farm Admin	2025-04-03 22:43:01.499531	Wash Inventory - North Field
126	4	51	1	52	Farm Admin	2025-04-03 22:43:04.841223	Wash Inventory - North Field
127	4	52	-37	15	Farm Admin	2025-04-03 22:43:19.266595	Wash Inventory - North Field
128	4	1	2	3	Farm Admin	2025-04-03 22:43:36.483969	Crop Needs - North Field
129	4	5	1	6	Kitchen Update	2025-04-03 22:44:09.969919	Kitchen
130	4	6	1	7	Kitchen Update	2025-04-03 22:44:11.47886	Kitchen
131	149	0	10	10	Farm Admin	2025-04-03 22:46:41.681106	\N
132	4	15	1	16	Farm Admin	2025-04-03 22:47:43.904745	Wash Inventory - North Field
133	4	16	74	90	Farm Admin	2025-04-03 22:47:53.23884	Wash Inventory - North Field
134	4	7	1	8	Wholesale Update	2025-04-03 22:48:03.442666	Wholesale
135	153	0	1	1	Farm Admin	2025-04-03 22:52:47.228264	Side Hill 1
136	153	0	1	1	Farm Admin	2025-04-03 22:52:57.933558	Wash Inventory - Side Hill 1
137	153	0	1	1	Farm Admin	2025-04-03 22:53:03.586487	Stand Inventory - Side Hill 1
138	9	158	-158	0	Farm Admin	2025-04-04 20:37:50.949283	Stand Inventory - Side Hill 3
139	8	15	-14	1	Farm Admin	2025-04-04 20:38:05.115623	Stand Inventory - Upper Blais
140	4	90	-1	89	Farm Admin	2025-04-04 20:38:28.843401	Wash Inventory - North Field
141	4	89	1	90	Farm Admin	2025-04-04 20:38:33.560224	Wash Inventory - North Field
142	4	90	-1	89	Farm Admin	2025-04-04 20:38:37.156377	Wash Inventory - North Field
143	4	89	1	90	Farm Admin	2025-04-04 20:38:40.008524	Wash Inventory - North Field
144	4	90	-1	89	Farm Admin	2025-04-04 20:38:44.369393	Wash Inventory - North Field
145	4	89	-1	88	Farm Admin	2025-04-04 20:38:46.716901	Wash Inventory - North Field
146	4	88	-1	87	Farm Admin	2025-04-04 20:38:49.24099	Wash Inventory - North Field
147	8	0	1	1	Wholesale Update	2025-04-04 20:41:34.977246	Wholesale
148	8	1	1	2	Wholesale Update	2025-04-04 20:42:17.522346	Wholesale
149	8	2	18	20	Wholesale Update	2025-04-04 20:42:22.322972	Wholesale
150	8	20	1	21	Wholesale Update	2025-04-04 20:42:27.073446	Wholesale
151	8	21	-1	20	Wholesale Update	2025-04-04 20:42:28.497337	Wholesale
152	8	20	-1	19	Wholesale Update	2025-04-04 20:42:29.112046	Wholesale
153	8	19	-1	18	Wholesale Update	2025-04-04 20:42:29.646221	Wholesale
154	4	0	1	1	Farm Admin	2025-04-04 20:42:37.586496	Stand Inventory - North Field
155	4	1	-1	0	Farm Admin	2025-04-04 20:42:39.669388	Stand Inventory - North Field
156	7	15	1	16	Farm Admin	2025-04-04 20:44:34.160369	Stand Inventory - Upper Blais
157	3	1	1	2	Farm Admin	2025-04-06 15:10:46.640315	Stand Inventory - Veg. Ridge
158	3	1	1	2	Farm Admin	2025-04-06 15:10:54.964955	Wash Inventory - Side Hill 3
159	3	2	1	3	Farm Admin	2025-04-06 15:10:57.276268	Wash Inventory - Side Hill 3
160	3	3	47	50	Farm Admin	2025-04-06 15:11:04.021433	Wash Inventory - Side Hill 3
161	3	2	1	3	Farm Admin	2025-04-06 15:26:01.370657	Stand Inventory - Side Hill 3
162	3	3	1	4	Farm Admin	2025-04-06 15:26:03.993126	Stand Inventory - Side Hill 3
163	3	50	-1	49	Farm Admin	2025-04-06 15:26:08.147835	Wash Inventory - Hoop House
164	3	4	1	5	Farm Admin	2025-04-06 15:28:38.660442	Stand Inventory - Hoop House
165	3	5	1	6	Farm Admin	2025-04-06 15:28:40.860409	Stand Inventory - Hoop House
166	4	0	1	1	Farm Admin	2025-04-06 15:28:45.190811	Stand Inventory - North Field
167	5	1	1	2	Farm Admin	2025-04-06 16:06:56.076445	Wash Inventory - Upper Blais
168	5	2	1	3	Farm Admin	2025-04-06 16:07:35.068412	Wash Inventory - Upper Blais
169	8	1	1	2	Farm Admin	2025-04-06 16:13:04.860549	Stand Inventory - Upper Blais
170	10	1	1	2	Farm Admin	2025-04-06 16:13:25.534078	Stand Inventory - Side Hill 3
171	153	1	1	2	Farm Admin	2025-04-06 16:39:20.692931	Stand Inventory - Side Hill 1
172	57	1	1	2	Farm Admin	2025-04-06 17:07:20.87337	Wash Inventory - Side Hill 3
173	57	2	3	5	Farm Admin	2025-04-06 17:07:22.613333	Wash Inventory - Side Hill 3
174	153	0	20	20	Farm Admin	2025-04-07 18:22:35.376215	Harvest Bins - Side Hill 1
175	153	0	1	1	Farm Admin	2025-04-07 18:22:39.322976	Units Harvested - Side Hill 1
176	153	1	1	2	Farm Admin	2025-04-07 18:22:42.894697	Wash Inventory - Side Hill 1
177	153	2	1	3	Farm Admin	2025-04-07 18:25:18.617511	Wash Inventory - East Greenhouse
178	153	3	1	4	Farm Admin	2025-04-07 18:25:21.403873	Wash Inventory - East Greenhouse
179	154	0	1	1	Farm Admin	2025-04-07 18:28:16.444797	Dane
180	4	8	1	9	Wholesale Update	2025-04-07 18:30:24.450574	Wholesale
181	4	9	1	10	Wholesale Update	2025-04-07 18:30:24.779681	Wholesale
182	4	10	-1	9	Wholesale Update	2025-04-07 18:30:25.933396	Wholesale
183	4	9	1	10	Wholesale Update	2025-04-07 18:30:26.931968	Wholesale
184	4	10	1	11	Wholesale Update	2025-04-07 18:30:27.206558	Wholesale
185	4	11	1	12	Kitchen Update	2025-04-07 18:30:28.480183	Kitchen
186	4	12	1	13	Kitchen Update	2025-04-07 18:30:28.776212	Kitchen
187	4	13	1	14	Kitchen Update	2025-04-07 18:30:29.180461	Kitchen
188	4	14	1	15	Kitchen Update	2025-04-07 18:30:29.743451	Kitchen
189	4	15	-1	14	Kitchen Update	2025-04-07 18:30:30.760964	Kitchen
190	4	14	-1	13	Kitchen Update	2025-04-07 18:30:31.189444	Kitchen
191	153	2	1	3	Farm Admin	2025-04-07 18:37:26.5507	Stand Inventory - East Greenhouse
192	153	4	-1	3	Farm Admin	2025-04-07 18:37:28.091856	Wash Inventory - East Greenhouse
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.products (id, name, field_location, current_stock, unit, retail_notes, image_url, date_added, crop_needs, stand_inventory, wash_inventory, harvest_bins, units_harvested, field_notes, show_in_wholesale, show_in_kitchen, show_in_retail) FROM stdin;
17	Toscano Kale	Kitchen	0	count		\N	2025-04-03 19:48:44.565385		2	1				f	f	t
4	Red Leaf	North Field	13	count		\N	2025-04-03 19:48:38.783427	3	1	87	1			f	f	t
7	Oak Leaf	Side Hill 1	0	count		\N	2025-04-03 19:48:41.648899		16					f	f	t
61	Salad Mix	Wholesale	0	count		\N	2025-04-03 19:48:57.41889	15						f	f	t
9	Salanova	Kitchen	0	count		\N	2025-04-03 19:48:42.199918	80	0					f	f	t
10	Arugula	Rt. 25	0	count		\N	2025-04-03 19:48:42.486708		2					f	f	t
5	Iceberg	Upper Blais	0	count		\N	2025-04-03 19:48:39.070774		1	3	2			f	f	t
6	Green Leaf	Upper Blais	0	count		\N	2025-04-03 19:48:41.363993	15	1					f	f	t
60	Annina Eggplant	Upper Blais	0	count	BENNY BOY when are we getting this good stuff?????	\N	2025-04-03 19:48:57.136939	5		5				f	f	t
57	Oriental Eggplant	Side Hill 3	0	count	trump is the best	\N	2025-04-03 19:48:56.253104			5	1		test	f	f	t
11	Mixed Greens	Side Hill 3	0	count		\N	2025-04-03 19:48:42.772991							f	f	t
12	Spinach	Side Hill 3	0	count		\N	2025-04-03 19:48:43.06474	40						f	f	t
13	Baby Kale	Side Hill 3	0	count		\N	2025-04-03 19:48:43.351724							f	f	t
14	Kale	Veg. Ridge	0	count		\N	2025-04-03 19:48:43.646722							f	f	t
15	Red Kale	Veg. Ridge	0	count		\N	2025-04-03 19:48:43.951314							f	f	t
16	Green Kale	Veg. Ridge	0	count		\N	2025-04-03 19:48:44.259212							f	f	t
18	Herbs	Veg. Ridge	0	count		\N	2025-04-03 19:48:44.855431							f	f	t
19	Dill	Veg. Ridge	0	count		\N	2025-04-03 19:48:45.149565							f	f	t
20	Cilantro	Veg. Ridge	0	count		\N	2025-04-03 19:48:45.439387							f	f	t
21	Parsley	Veg. Ridge	0	count		\N	2025-04-03 19:48:45.730886							f	f	t
23	Bok Choy	Side Hill 3	0	count		\N	2025-04-03 19:48:46.302688							f	f	t
24	Red Beets	Veg. Ridge	0	count		\N	2025-04-03 19:48:46.586369							f	f	t
25	Gold Beets	Veg. Ridge	0	count		\N	2025-04-03 19:48:46.884304							f	f	t
26	Loose Red Beets	Veg. Ridge	0	count		\N	2025-04-03 19:48:47.195758							f	f	t
27	Loose Gold Beets	Veg. Ridge	0	count		\N	2025-04-03 19:48:47.497709							f	f	t
28	Beet Greens	Veg. Ridge	0	count		\N	2025-04-03 19:48:47.788424							f	f	t
29	Swiss Chard	Lower Blais	0	count		\N	2025-04-03 19:48:48.075945							f	f	t
30	Carrots	Lower Blais	0	count		\N	2025-04-03 19:48:48.376041							f	f	t
31	Rainbow Carrots	Lower Blais	0	count		\N	2025-04-03 19:48:48.672383							f	f	t
32	Loose Carrots	Lower Blais	0	count		\N	2025-04-03 19:48:48.974835							f	f	t
33	Parsnips	Lower Blais	0	count		\N	2025-04-03 19:48:49.264561							f	f	t
34	Garlic Scapes	Lower Blais	0	count		\N	2025-04-03 19:48:49.55878							f	f	t
35	Scallions	Lower Blais	0	count		\N	2025-04-03 19:48:49.846781							f	f	t
36	Loose Onions	Lower Blais	0	count		\N	2025-04-03 19:48:50.127516							f	f	t
37	Leeks	Rock Pile	0	count		\N	2025-04-03 19:48:50.412128							f	f	t
38	Bunched Onions	Corn Ridge	0	count		\N	2025-04-03 19:48:50.698534							f	f	t
39	Yellow Onions	Corn Ridge	0	count		\N	2025-04-03 19:48:50.993988							f	f	t
40	Red Onions	Corn Ridge	0	count		\N	2025-04-03 19:48:51.272025							f	f	t
41	Celery	Stone Wall	0	count		\N	2025-04-03 19:48:51.566432							f	f	t
42	Broccoli	Side Hill 1	0	count		\N	2025-04-03 19:48:51.862797							f	f	t
43	Cauliflower	Side Hill 1	0	count		\N	2025-04-03 19:48:52.14909							f	f	t
44	Green Cabbage	Side Hill 2	0	count		\N	2025-04-03 19:48:52.452347							f	f	t
45	Red Cabbage	Rt. 25	0	count		\N	2025-04-03 19:48:52.745079							f	f	t
46	Brussel Sprouts	Rt. 25	0	count		\N	2025-04-03 19:48:53.05912							f	f	t
47	Artichokes	Rt. 25	0	count		\N	2025-04-03 19:48:53.348937							f	f	t
48	Green Peppers	Stone Wall	0	count		\N	2025-04-03 19:48:53.632717							f	f	t
49	Colored Peppers	Stone Wall	0	count		\N	2025-04-03 19:48:53.913188							f	f	t
50	Purple	Stone Wall	0	count		\N	2025-04-03 19:48:54.189529							f	f	t
51	Cubanelle	Stone Wall	0	count		\N	2025-04-03 19:48:54.478398							f	f	t
52	Shishito	Stone Wall	0	count		\N	2025-04-03 19:48:54.782834							f	f	t
53	Poblano	Stone Wall	0	count		\N	2025-04-03 19:48:55.078013							f	f	t
54	Mixed Hots	Stone Wall	0	count		\N	2025-04-03 19:48:55.374764							f	f	t
55	Lunchbox	Stone Wall	0	count		\N	2025-04-03 19:48:55.665429							f	f	t
58	Italian Eggplant	Upper Blais	0	count		\N	2025-04-03 19:48:56.540767							f	f	t
59	Purple Eggplant	Upper Blais	0	count		\N	2025-04-03 19:48:56.840705							f	f	t
62	Nova	Kitchen	0	count		\N	2025-04-03 19:48:57.706296	15						f	f	t
63	Scallions	Kitchen	0	count		\N	2025-04-03 19:48:57.997444							f	f	t
64	Bok Choy	Kitchen	0	count		\N	2025-04-03 19:48:58.310847							f	f	t
65	Butternut	Kitchen	0	count		\N	2025-04-03 19:48:58.623049							f	f	t
66	Red Potatoes	Dane	0	count		\N	2025-04-03 19:48:58.913053							f	f	t
67	White Potatoes	Dane	0	count		\N	2025-04-03 19:48:59.199331							f	f	t
68	Yukon	Dane	0	count		\N	2025-04-03 19:48:59.482774							f	f	t
69	Fingerling	Dane	0	count		\N	2025-04-03 19:48:59.762253							f	f	t
70	Quarts	Dane	0	count		\N	2025-04-03 19:49:00.046093							f	f	t
71	Bags	Dane	0	count		\N	2025-04-03 19:49:00.339888							f	f	t
72	Cherry Tomatoes	Hoisington	0	count		\N	2025-04-03 19:49:00.626216							f	f	t
73	Slicing Tomatoes	Stone Wall	0	count		\N	2025-04-03 19:49:00.911571							f	f	t
74	Canner	Stone Wall	0	count		\N	2025-04-03 19:49:01.188993							f	f	t
75	Heirlooms	Stone Wall	0	count		\N	2025-04-03 19:49:01.662627							f	f	t
76	Plum	Stone Wall	0	count		\N	2025-04-03 19:49:01.961532							f	f	t
77	Orange	Stone Wall	0	count		\N	2025-04-03 19:49:02.256265							f	f	t
3	Head Lettuce	Hoisington	0	count		\N	2025-04-03 19:48:38.43861		6	49				f	f	t
8	Romaine	Upper Blais	18	count		\N	2025-04-03 19:48:41.922329	5	2	9				f	f	t
56	Eggplant	Upper Blais	0	count		\N	2025-04-03 19:48:55.966856		1					f	f	t
22	Basil	Side Hill 3	0	count		\N	2025-04-03 19:48:46.016757						Lots coming - BEN	f	f	t
78	Yellow Beans	Lower Blais	0	count		\N	2025-04-03 19:49:02.54244							f	f	t
79	Green Beans	Lower Blais	0	count		\N	2025-04-03 19:49:02.838549							f	f	t
80	Bagged Beans	Lower Blais	0	count		\N	2025-04-03 19:49:03.126346							f	f	t
81	Snap Peas	Lower Blais	0	count		\N	2025-04-03 19:49:03.416224							f	f	t
82	Shell Peas	Lower Blais	0	count		\N	2025-04-03 19:49:03.575343							f	f	t
83	Strawberries	Lower Blais	0	count		\N	2025-04-03 19:49:03.722259							f	f	t
84	Corn	Corn Ridge	0	count		\N	2025-04-03 19:49:03.871052							f	f	t
143	Red Leaf	Wholesale	0	count		\N	2025-04-03 21:07:55.110723	\N	\N	1	\N	\N		f	f	t
144	Red Leaf	Wholesale	0	count		\N	2025-04-03 21:07:55.284345	\N	\N	1	\N	\N		f	f	t
145	Red Leaf	Wholesale	0	count		\N	2025-04-03 21:07:55.456394	\N	\N	1	\N	\N		f	f	t
146	Red Leaf	Wholesale	0	count		\N	2025-04-03 21:07:55.807842	\N	\N	1	\N	\N		f	f	t
149	Test Crop	North Field	10	lb	\N	\N	2025-04-03 22:46:41.628062	\N	\N	\N	\N	\N	\N	f	f	t
154	Sumner	Dane	1	unit		\N	2025-04-07 18:28:16.384595		0	0	0	0		f	f	t
153	Jeff Mills	East Greenhouse	1	unit	Jeff is a PIA	\N	2025-04-03 22:52:47.177967	5	3	3	20	1	Ben is great 	f	f	t
90	Head Lettuce	Kitchen	5	count		\N	2025-04-03 20:14:18.12239	\N	\N	\N	\N	\N	\N	f	f	t
91	Red Leaf	Kitchen	3	count		\N	2025-04-03 20:20:53.133044	\N	\N	\N	\N	\N		f	f	t
87	Red Leaf	Wholesale	1	count		\N	2025-04-03 20:10:48.288801	\N	\N	2	\N	\N	\N	f	f	t
92	Red Leaf	Wholesale	0	count		\N	2025-04-03 20:39:42.196583	\N	\N	1	\N	\N		f	f	t
93	Red Leaf	Wholesale	0	count		\N	2025-04-03 20:39:43.254696	\N	\N	1	\N	\N		f	f	t
94	Red Leaf	Wholesale	0	count		\N	2025-04-03 20:39:43.860185	\N	\N	1	\N	\N		f	f	t
95	Red Leaf	Wholesale	0	count		\N	2025-04-03 20:39:45.771141	\N	\N	1	\N	\N		f	f	t
96	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:39:59.771416	\N	\N	1	\N	\N		f	f	t
97	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:40:00.488159	\N	\N	1	\N	\N		f	f	t
98	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:40:02.489482	\N	\N	1	\N	\N		f	f	t
99	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:40:02.720086	\N	\N	1	\N	\N		f	f	t
100	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:40:02.917655	\N	\N	1	\N	\N		f	f	t
101	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:40:03.065978	\N	\N	1	\N	\N		f	f	t
102	Head Lettuce	Kitchen	0	count		\N	2025-04-03 20:40:03.524028	\N	\N	1	\N	\N		f	f	t
103	Head Lettuce	Kitchen	0	count		\N	2025-04-03 20:40:03.708458	\N	\N	1	\N	\N		f	f	t
104	Head Lettuce	Kitchen	0	count		\N	2025-04-03 20:40:03.879643	\N	\N	1	\N	\N		f	f	t
105	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:40:04.407531	\N	\N	1	\N	\N		f	f	t
106	Head Lettuce	Kitchen	0	count		\N	2025-04-03 20:40:04.934089	\N	\N	0	\N	\N		f	f	t
107	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:40:07.482129	\N	\N	1	\N	\N		f	f	t
108	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:40:16.124475	\N	\N	1	\N	\N		f	f	t
109	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:40:16.473896	\N	\N	1	\N	\N		f	f	t
110	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:42:54.086187	\N	\N	1	\N	\N		f	f	t
111	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:42:55.310644	\N	\N	1	\N	\N		f	f	t
112	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:42:56.264352	\N	\N	1	\N	\N		f	f	t
113	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:42:56.769737	\N	\N	1	\N	\N		f	f	t
114	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:42:57.101225	\N	\N	1	\N	\N		f	f	t
115	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:42:57.242944	\N	\N	1	\N	\N		f	f	t
116	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:42:57.520037	\N	\N	1	\N	\N		f	f	t
117	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:42:57.802735	\N	\N	1	\N	\N		f	f	t
118	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:42:59.301854	\N	\N	1	\N	\N		f	f	t
119	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:43:00.864075	\N	\N	1	\N	\N		f	f	t
120	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:43:01.091562	\N	\N	1	\N	\N		f	f	t
121	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:46:07.588608	\N	\N	0	\N	\N		f	f	t
122	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:46:07.73563	\N	\N	0	\N	\N		f	f	t
123	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:46:09.019623	\N	\N	1	\N	\N		f	f	t
124	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:46:09.189774	\N	\N	1	\N	\N		f	f	t
125	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:46:09.337686	\N	\N	1	\N	\N		f	f	t
126	Red Leaf	Kitchen	0	count		\N	2025-04-03 20:46:09.490461	\N	\N	1	\N	\N		f	f	t
127	Red Leaf	Wholesale	0	count		\N	2025-04-03 21:03:22.632931	\N	\N	1	\N	\N		f	f	t
128	Red Leaf	Wholesale	0	count		\N	2025-04-03 21:03:22.789213	\N	\N	1	\N	\N		f	f	t
129	Red Leaf	Wholesale	0	count		\N	2025-04-03 21:03:23.04198	\N	\N	1	\N	\N		f	f	t
130	Red Leaf	Wholesale	0	count		\N	2025-04-03 21:05:30.076413	\N	\N	1	\N	\N		f	f	t
131	Red Leaf	Wholesale	0	count		\N	2025-04-03 21:05:30.481039	\N	\N	1	\N	\N		f	f	t
132	Red Leaf	Wholesale	0	count		\N	2025-04-03 21:05:31.148794	\N	\N	1	\N	\N		f	f	t
133	Red Leaf	Kitchen	0	count		\N	2025-04-03 21:05:34.160155	\N	\N	1	\N	\N		f	f	t
134	Red Leaf	Kitchen	0	count		\N	2025-04-03 21:05:34.726208	\N	\N	1	\N	\N		f	f	t
135	Red Leaf	Kitchen	0	count		\N	2025-04-03 21:05:35.157874	\N	\N	1	\N	\N		f	f	t
136	Red Leaf	Wholesale	0	count		\N	2025-04-03 21:05:35.851683	\N	\N	1	\N	\N		f	f	t
137	Red Leaf	Wholesale	0	count		\N	2025-04-03 21:05:36.083326	\N	\N	1	\N	\N		f	f	t
138	Red Leaf	Kitchen	0	count		\N	2025-04-03 21:05:43.293261	\N	\N	1	\N	\N		f	f	t
139	Red Leaf	Kitchen	0	count		\N	2025-04-03 21:05:43.516619	\N	\N	1	\N	\N		f	f	t
140	Red Leaf	Kitchen	0	count		\N	2025-04-03 21:05:49.284875	\N	\N	1	\N	\N		f	f	t
141	Red Leaf	Kitchen	0	count		\N	2025-04-03 21:05:49.673489	\N	\N	1	\N	\N		f	f	t
142	Red Leaf	Wholesale	0	count		\N	2025-04-03 21:07:51.721626	\N	\N	1	\N	\N		f	f	t
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.settings (id, key, value, updated_at) FROM stdin;
1	inventoryRowOrder	[57, 153, 56, 58, 59, 60, 4, 7, 10, 5, 6, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 3, 8, 78, 79, 80, 81, 82, 83, 84, 149, 154]	2025-04-06 16:04:30.268308
\.


--
-- Data for Name: site_auth; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.site_auth (id, password_hash, created_at, updated_at) FROM stdin;
1	f311e3573d8c02fd343886d25c3eaf4b2ddd8b38bd6c88122597621ae077f31c	2025-04-06 16:42:39.668397	2025-04-06 17:06:54.312
\.


--
-- Name: field_locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.field_locations_id_seq', 1046, true);


--
-- Name: inventory_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.inventory_history_id_seq', 192, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.products_id_seq', 154, true);


--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.settings_id_seq', 1, true);


--
-- Name: site_auth_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.site_auth_id_seq', 1, true);


--
-- Name: field_locations field_locations_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.field_locations
    ADD CONSTRAINT field_locations_name_key UNIQUE (name);


--
-- Name: field_locations field_locations_name_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.field_locations
    ADD CONSTRAINT field_locations_name_unique UNIQUE (name);


--
-- Name: field_locations field_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.field_locations
    ADD CONSTRAINT field_locations_pkey PRIMARY KEY (id);


--
-- Name: inventory_history inventory_history_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory_history
    ADD CONSTRAINT inventory_history_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: settings settings_key_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_key_key UNIQUE (key);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: site_auth site_auth_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.site_auth
    ADD CONSTRAINT site_auth_pkey PRIMARY KEY (id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

